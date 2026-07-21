CREATE TABLE workers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hourly_cost NUMERIC(10, 2) NOT NULL,
    max_hours_per_week INT NOT NULL,
    skills TEXT[]
);

CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    day_of_week INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    required_worker_count INT NOT NULL,
    required_skill VARCHAR(255)
);

CREATE TABLE shift_assignments (
    id SERIAL PRIMARY KEY,
    worker_id INT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    shift_id INT NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (worker_id, shift_id)
);

CREATE TABLE delivery_orders (
    id SERIAL PRIMARY KEY,
    destination_lat NUMERIC(9, 6) NOT NULL,
    destination_lng NUMERIC(9, 6) NOT NULL,
    deadline TIMESTAMP NOT NULL,
    weight_kg NUMERIC(8, 2) NOT NULL,
    priority INT DEFAULT 1
);

CREATE TABLE delivery_slots (
    id SERIAL PRIMARY KEY,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    max_capacity_kg NUMERIC(8, 2) NOT NULL,
    vehicle_id VARCHAR(255)
);

CREATE TABLE slot_assignments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
    slot_id INT NOT NULL REFERENCES delivery_slots(id) ON DELETE CASCADE,
    estimated_distance_km NUMERIC(8, 2)
);

CREATE INDEX idx_shift_assignments_worker_id ON shift_assignments(worker_id);
CREATE INDEX idx_shift_assignments_shift_id ON shift_assignments(shift_id);
CREATE INDEX idx_shifts_day_of_week ON shifts(day_of_week);

CREATE INDEX idx_slot_assignments_order_id ON slot_assignments(order_id);
CREATE INDEX idx_slot_assignments_slot_id ON slot_assignments(slot_id);
CREATE INDEX idx_delivery_orders_deadline ON delivery_orders(deadline);
