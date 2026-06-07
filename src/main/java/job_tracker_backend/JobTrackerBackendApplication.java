package job_tracker_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class JobTrackerBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(JobTrackerBackendApplication.class, args);
	}
}
