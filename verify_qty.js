

async function test() {
    const BASE_URL = 'https://wareopt-backend.onrender.com/api';
    console.log("Creating item...");
    let res = await fetch(BASE_URL + '/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sku: 'TEST-QTY-1',
            name: 'Test Qty',
            quantityOnHand: 0,
            unit: 'box'
        })
    });
    let item = await res.json();
    console.log("Created:", item);

    console.log("Updating quantity to 50...");
    item.quantityOnHand = 50;
    let updateRes = await fetch(BASE_URL + '/inventory/' + item.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    let updatedItem = await updateRes.json();
    console.log("Updated:", updatedItem);

    console.log("Checking stock movements...");
    let historyRes = await fetch(BASE_URL + '/inventory/' + item.id + '/history');
    let history = await historyRes.json();
    console.log("History:", history);
}
test().catch(console.error);
