import random
import time
import string
from datetime import datetime
import asyncio


charges = {}
refunds = []
customers = []


def random_string(length=10):
    return "".join(
        random.choice(string.ascii_lowercase + string.digits) for i in range(length)
    )


def create_charge(customer_id):
    return {
        "id": f"ch_{random_string()}",
        "amount": random.randint(100, 10000),
        "currency": "usd",
        "description": random_string(),
        "created": round(time.time()),
        "customer": customer_id,
        "refunded": False,
    }


def format_refund(refund):
    return {
        "id": refund["id"],
        "charge": refund["charge"],
        "amount": "${:,.2f}".format(refund["amount"] / 100),
        "currency": refund["currency"],
        "created": datetime.utcfromtimestamp(refund["created"]).strftime(
            "%Y-%m-%d %H:%M:%S"
        ),
    }


def format_charge(charge):
    return {
        "id": charge["id"],
        "amount": "${:,.2f}".format(charge["amount"] / 100),
        "description": charge["description"],
        "created": datetime.utcfromtimestamp(charge["created"]).strftime(
            "%Y-%m-%d %H:%M:%S"
        ),
        "isRefunded": charge["refunded"],
    }


async def get_refunds():
    # Replaces Stripe SDK call
    # return stripe.Refund.list()
    return [format_refund(refund) for refund in refunds]


async def get_charges():
    # Replaces Stripe SDK call
    # return stripe.Charge.list()
    return [
        format_charge(charge)
        for customer_id in charges
        for charge in charges[customer_id]
    ]


async def get_customer_charges(customer_id):
    if not customer_id:
        raise Exception("A customer id is required")

    if customer_id not in charges:
        charges[customer_id] = [
            create_charge(customer_id) for i in range(random.randint(1, 5))
        ]

    # Replaces Stripe SDK call
    # return stripe.Charge.list(customer=customer_id)
    customer_charges = charges[customer_id]
    return [format_charge(charge) for charge in customer_charges]


async def refund_charge(charge_id):
    await asyncio.sleep(1)

    if not charge_id:
        raise Exception("A charge id is required")

    charge = next(
        charge
        for customer_id in charges
        for charge in charges[customer_id]
        if charge["id"] == charge_id
    )
    if not charge:
        raise Exception("Charge not found")
    if charge["refunded"]:
        raise Exception("Charge already refunded")

    refund = {
        "id": f"ch_{random_string()}",
        "amount": charge["amount"],
        "charge": charge["id"],
        "currency": charge["currency"],
        "created": round(time.time()),
    }

    charge_index = next(
        i
        for i in range(len(charges[charge["customer"]]))
        if charges[charge["customer"]][i]["id"] == charge_id
    )

    # Replaces Stripe SDK call
    # stripe.Refund.create(charge=charge_id)
    charge["refunded"] = True
    charges[charge["customer"]][charge_index] = charge

    refunds.append(refund)

    return refund
