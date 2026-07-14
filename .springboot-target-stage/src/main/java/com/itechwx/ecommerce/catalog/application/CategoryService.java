package com.itechwx.ecommerce.catalog.application;

import java.util.List;

public interface CategoryService {

    CategoryView create(String name, Integer sort, String parentId);

    List<CategoryView> findAll();

    CategoryView findOne(String id);

    CategoryView update(String id, String name, Integer sort);

    void remove(String id);
}
