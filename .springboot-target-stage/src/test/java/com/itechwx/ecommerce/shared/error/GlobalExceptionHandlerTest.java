package com.itechwx.ecommerce.shared.error;

import com.itechwx.ecommerce.shared.api.SuccessEnvelopeAdvice;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ValidationProbeController())
                .setControllerAdvice(new GlobalExceptionHandler(), new SuccessEnvelopeAdvice())
                .build();
    }

    @Test
    void returnsTypedValidationErrorWithoutInternalDetails() throws Exception {
        mockMvc.perform(post("/validation-probe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.violations.name[0]").value("name is required"))
                .andExpect(jsonPath("$.stack").doesNotExist());
    }

    @Test
    void preservesLiveSuccessEnvelopeFields() throws Exception {
        mockMvc.perform(post("/validation-probe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"fixture\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.metadata.name").value("fixture"));
    }

    @RestController
    static class ValidationProbeController {
        @PostMapping("/validation-probe")
        ProbeRequest validate(@Valid @RequestBody ProbeRequest request) {
            return request;
        }
    }

    record ProbeRequest(@NotBlank(message = "name is required") String name) {
    }
}

