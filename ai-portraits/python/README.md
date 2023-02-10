Environment setup:

```bash
mkdir training_images
mkdir trained_models
mkdir outputs

git clone https://github.com/huggingface/diffusers

git clone https://github.com/JoePenna/Dreambooth-Stable-Diffusion
cd Dreambooth-Stable-Diffusion

pip install omegaconf
pip install einops
pip install pytorch-lightning==1.6.5
pip install test-tube
pip install transformers
pip install kornia
pip install setuptools==59.5.0
pip install pillow==9.0.1
pip install torchmetrics==0.6.0
pip install -e .
pip install protobuf==3.20.1
pip install gdown
pip install -qq diffusers transformers ftfy
pip install huggingface_hub
pip install captionizer==1.0.1
pip install safetensors

git clone https://github.com/djbielejeski/Stable-Diffusion-Regularization-Images-person_ddim.git regularization_images
cd ..

pip install interval-sdk
pip install -e git+https://github.com/CompVis/taming-transformers.git@master#egg=taming-transformers
pip install -e git+https://github.com/openai/CLIP.git@main#egg=clip
```
