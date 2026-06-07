package job_tracker_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/v1/health")
    public String health() {
        return "Job Tracker API is running!";
    }
}

