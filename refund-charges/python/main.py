import os
from dotenv import load_dotenv
from datetime import datetime
from interval_sdk import Interval, IO, ctx_var
from payments import get_customer_charges, refund_charge, get_refunds

from interval_sdk.classes.page import Page
from interval_sdk.classes.layout import Layout

load_dotenv()

interval = Interval(
    api_key=os.environ["INTERVAL_KEY"],
)

refunds_page = Page(name="Refunds")
interval.routes.add("refunds", refunds_page)


@refunds_page.handle
async def handler(display: IO.Display):
    refunds = await get_refunds()

    return Layout(
        title="Refunds",
        description="View and create refunds for our customers.",
        menu_items=[
            {"label": "Create refund", "route": "refunds/refund_user"},
        ],
        children=[
            display.metadata(
                "",
                layout="card",
                data=[
                    {"label": "Total refunds", "value": len(refunds)},
                ],
            ),
            display.table("Refunds", data=refunds),
        ],
    )


@refunds_page.action(name="Refund user", unlisted=True)
async def refund_user(io: IO):
    customer_email = await io.input.email("Email of the customer to refund:")

    charges = await get_customer_charges(customer_email)

    charges_to_refund = await io.select.table(
        "Select one or more charges to refund",
        data=charges,
        min_selections=1,
    )

    ctx = ctx_var.get()
    await ctx.loading.start(
        label="Refunding charges",
        items_in_queue=len(charges_to_refund),
    )

    for charge in charges_to_refund:
        await refund_charge(charge["id"])
        await ctx.loading.complete_one()

    return {"charges_to_refund": len(charges_to_refund)}


interval.listen()
