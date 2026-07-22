package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.entity.InventoryItem;
import com.wareopt.backend.backend.repository.InventoryItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    public List<InventoryItem> getAllInventoryItems() {
        return inventoryItemRepository.findAll();
    }

    public InventoryItem getInventoryItemById(Long id) {
        return inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item not found"));
    }

    public InventoryItem createInventoryItem(InventoryItem item) {
        if (item.getQuantityOnHand() == null || item.getQuantityOnHand() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity on hand cannot be negative");
        }
        if (inventoryItemRepository.existsBySku(item.getSku())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An inventory item with this SKU already exists");
        }
        item.setId(null);
        return inventoryItemRepository.save(item);
    }

    public InventoryItem updateInventoryItem(Long id, InventoryItem itemDetails) {
        if (itemDetails.getQuantityOnHand() == null || itemDetails.getQuantityOnHand() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity on hand cannot be negative");
        }
        if (inventoryItemRepository.existsBySkuAndIdNot(itemDetails.getSku(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An inventory item with this SKU already exists");
        }

        InventoryItem item = getInventoryItemById(id);

        item.setSku(itemDetails.getSku());
        item.setName(itemDetails.getName());
        item.setDescription(itemDetails.getDescription());
        item.setQuantityOnHand(itemDetails.getQuantityOnHand());
        item.setUnit(itemDetails.getUnit());
        item.setWarehouseLocation(itemDetails.getWarehouseLocation());
        item.setReorderThreshold(itemDetails.getReorderThreshold());
        item.setCostPerUnit(itemDetails.getCostPerUnit());

        return inventoryItemRepository.save(item);
    }

    public void deleteInventoryItem(Long id) {
        if (!inventoryItemRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item not found");
        }
        inventoryItemRepository.deleteById(id);
    }
}
