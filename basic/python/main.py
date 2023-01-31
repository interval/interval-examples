import os

from interval_sdk import Interval, IO
from dotenv import load_dotenv

load_dotenv()

interval = Interval(api_key=os.environ["INTERVAL_KEY"])


@interval.action
async def hello_world(io: IO):
    name = await io.input.text("Enter your name")
    return f"Hello, {name}!"


interval.listen()
