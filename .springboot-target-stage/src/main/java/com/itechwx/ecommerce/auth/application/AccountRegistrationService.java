package com.itechwx.ecommerce.auth.application;

public interface AccountRegistrationService {

    UserRegistrationResponse registerUser(UserRegistrationCommand command);

    ShopLoginResponse registerShop(ShopRegistrationCommand command);
}
