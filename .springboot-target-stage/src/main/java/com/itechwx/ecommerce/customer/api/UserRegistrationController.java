package com.itechwx.ecommerce.customer.api;

import com.itechwx.ecommerce.auth.application.AccountRegistrationService;
import com.itechwx.ecommerce.auth.application.UserRegistrationCommand;
import com.itechwx.ecommerce.auth.application.UserRegistrationResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
public class UserRegistrationController {

    private final AccountRegistrationService registrationService;

    public UserRegistrationController(AccountRegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/registerManual")
    UserRegistrationResponse register(@Valid @RequestBody UserRegistrationRequest request) {
        return registrationService.registerUser(new UserRegistrationCommand(
                request.username(),
                request.email(),
                request.password(),
                request.name(),
                request.avatar(),
                request.phone(),
                request.address(),
                request.timezone(),
                request.language(),
                request.dateOfBirth(),
                request.sex(),
                request.currency(),
                request.theme(),
                request.profileVisibility(),
                request.emailNotifications() == null || request.emailNotifications(),
                Boolean.TRUE.equals(request.smsNotifications()),
                request.pushNotifications() == null || request.pushNotifications(),
                Boolean.TRUE.equals(request.dataSharing()),
                request.deviceName()
        ));
    }
}
