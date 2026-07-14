package com.itechwx.ecommerce.catalog.api;

import com.itechwx.ecommerce.auth.security.AdminOnly;
import com.itechwx.ecommerce.catalog.application.CategoryService;
import com.itechwx.ecommerce.catalog.application.CategoryView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/category")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @AdminOnly
    @PostMapping
    CategoryView create(@Valid @RequestBody CreateCategoryRequest request) {
        return categoryService.create(request.name(), request.sort(), request.parentId());
    }

    @GetMapping
    List<CategoryView> findAll() {
        return categoryService.findAll();
    }

    @GetMapping("/{id}")
    CategoryView findOne(@PathVariable @Size(max = 128) String id) {
        return categoryService.findOne(id);
    }

    @AdminOnly
    @PatchMapping("/{id}")
    CategoryView update(
            @PathVariable @Size(max = 128) String id,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        return categoryService.update(id, request.name(), request.sort());
    }

    @AdminOnly
    @DeleteMapping("/{id}")
    CategoryRemovalResponse remove(@PathVariable @Size(max = 128) String id) {
        categoryService.remove(id);
        return new CategoryRemovalResponse(true);
    }
}
