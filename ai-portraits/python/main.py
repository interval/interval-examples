import os
import glob
import base64
import io as _io
import subprocess
from datetime import datetime
from interval_sdk import Interval, IO, ctx_var
from interval_sdk.classes.page import Page
from interval_sdk.classes.layout import Layout
from huggingface_hub import hf_hub_download
from diffusers import StableDiffusionPipeline
import torch

training_images_dir = "./training_images"
base_model_path = "./Dreambooth-Stable-Diffusion/model.ckpt"
trained_models_dir = "./trained_models"
outputs_dir = "./outputs"

images = {}
for image_path in glob.glob(f"{outputs_dir}/*.png"):
    with open(image_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
        images[image_path] = {
            "path": image_path,
            "url": f"data:image/jpeg;base64,{data}",
        }

interval = Interval(
    os.environ.get("INTERVAL_KEY"),
)

page = Page(name="Images")


@page.handle
async def handler(display: IO.Display):
    return Layout(
        title="Images",
        description="AI generated images that you've previously generated.",
        children=[
            display.grid(
                "Latest images",
                data=[image for key, image in images.items()],
                render_item=lambda x: {
                    "menu": [
                        {
                            "label": "Delete",
                            "route": "images/delete",
                            "params": {"path": x["path"]},
                        }
                    ],
                    "image": {
                        "url": x["url"],
                        "aspectRatio": 1,
                    },
                },
                default_page_size=8,
                is_filterable=False,
            ),
        ],
    )


@page.action(unlisted=True)
async def generate(io: IO):

    models = [f.name for f in os.scandir(trained_models_dir) if f.is_dir()]

    [prompt, model] = await io.group(
        io.input.text(
            "What's the prompt?",
            help_text='To activate your trained images include "triggerword person" in the prompt.',
        ),
        io.select.single("Which model do you want to use?", options=models),
    )

    ctx = ctx_var.get()
    await ctx.loading.start(
        title="Generating image...",
        description="This may take a while on a CPU."
        if not torch.cuda.is_available()
        else "",
    )

    pipe = StableDiffusionPipeline.from_pretrained(f"{trained_models_dir}/{model}").to(
        "cuda" if torch.cuda.is_available() else "cpu"
    )
    image = pipe(
        prompt=prompt,
        negative_prompt="multiple people, ugly, deformed, malformed limbs, low quality, blurry, naked, out of frame",
        num_inference_steps=50,
    ).images[0]

    now = datetime.now()
    image_path = f"{outputs_dir}/{now.strftime('%Y-%m-%d_%H-%M-%S')}.png"
    image.save(image_path, format="PNG")

    img_bytes = _io.BytesIO()
    image.save(img_bytes, format="PNG")

    data = base64.b64encode(img_bytes.getvalue()).decode("utf-8")
    images[image_path] = {
        "path": image_path,
        "url": f"data:image/jpeg;base64,{data}",
    }

    await io.display.image(
        "Generated image",
        bytes=img_bytes.getvalue(),
        size="large",
    )

    return "All done!"


@page.action(unlisted=True)
async def delete(io: IO):
    ctx = ctx_var.get()
    path = ctx.params.get("path", None)
    if not path:
        return "No image path provided"

    if not os.path.isfile(path):
        return "No such image to delete"

    confirmed = await io.confirm(f"Really delete?", help_text="This can't be undone")
    if confirmed:
        os.remove(path)
        del images[path]

    return f"{path} deleted!"


interval.routes.add("images", page)


@interval.action
async def train_model(io: IO):
    ctx = ctx_var.get()

    model_name = await io.input.text(
        "What do you want to call your custom model?",
        help_text='This will also be used as the "trigger word" for your trained model.',
    ).validate(
        lambda name: "Model name must be one word (no spaces)"
        if name.strip().count(" ") > 0
        else None
    )

    images = (
        await io.input.file(
            "Upload images to train your model on",
            help_text="10-20 images is best, ideally with a variety of poses, lighting, distance, but also generally as close as possible to the kind of images you're trying to generate.",
        )
        .multiple()
        .validate(
            lambda files: "You must provide an even number of files"
            if len(files) % 2 != 0
            else None
        )
    )

    for image in images:
        filename = f"training_images/{model_name}/{image.name}"
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "wb") as f:
            f.write(image.read())

    if not os.path.isfile(base_model_path):
        await ctx.loading.start("Downloading model to train...")

        model_path = hf_hub_download(
            repo_id="runwayml/stable-diffusion-v1-5",
            filename="v1-5-pruned.ckpt",
        )

        proc = subprocess.Popen(["readlink", "-f", model_path], stdout=subprocess.PIPE)
        real_path = proc.stdout.read()
        subprocess.run(
            [
                "mv",
                real_path.strip(),
                base_model_path,
            ]
        )

    confirmed = await io.confirm(
        "Ready to train?", help_text="This could take a while..."
    )
    if confirmed:
        await ctx.loading.start(title="Training model on your images...")

        subprocess.run(
            [
                "python",
                "Dreambooth-Stable-Diffusion/main.py",
                "--base",
                "Dreambooth-Stable-Diffusion/configs/stable-diffusion/v1-finetune_unfrozen.yaml",
                "-t",
                "--actual_resume",
                base_model_path,
                "--reg_data_root",
                "Dreambooth-Stable-Diffusion/regularization_images/person_ddim",
                "-n",
                model_name,
                "--gpus",
                "0,",
                "--data_root",
                f"{training_images_dir}/{model_name}",
                "--max_training_steps",
                "2000",
                "--class_word",
                "person",
                "--token",
                model_name,
                "--no-test",
            ]
        )

        await ctx.loading.start(
            title="Done training! Converting to diffusers format..."
        )

        latest_model_dir = max(glob.glob(f"./logs/{model_name}*"), key=os.path.getmtime)

        subprocess.run(
            [
                "python",
                "diffusers/scripts/convert_original_stable_diffusion_to_diffusers.py",
                "--checkpoint_path",
                f"{latest_model_dir}/checkpoints/last.ckpt",
                "--dump_path",
                f"{trained_models_dir}/{model_name}",
            ]
        )

    return "All done!"


interval.listen()
