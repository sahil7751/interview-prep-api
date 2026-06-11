package com.jobtracker.scheduler;

import com.jobtracker.entity.Application;
import com.jobtracker.entity.ApplicationStatus;
import com.jobtracker.entity.Interview;
import com.jobtracker.entity.Notification;
import com.jobtracker.entity.NotificationType;
import com.jobtracker.repository.ApplicationRepository;
import com.jobtracker.repository.InterviewRepository;
import com.jobtracker.repository.NotificationRepository;
import com.jobtracker.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final NotificationRepository notificationRepository;
    private final InterviewRepository interviewRepository;
    private final ApplicationRepository applicationRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processDueNotifications() {
        List<Notification> dueNotifications = notificationRepository
                .findUnsentDueNotifications(LocalDateTime.now());

        for (Notification notification : dueNotifications) {
            notification.setIsSent(true);
            notification.setIsRead(false);
            notificationRepository.save(notification);
            log.info("Notification sent: {} -> user {}",
                    notification.getTitle(), notification.getUser().getEmail());
        }
    }

        @Scheduled(fixedRate = 10000)
    @Transactional
    public void scheduleInterviewReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime in24Hours = now.plusHours(24);

        List<Interview> upcomingInterviews = interviewRepository.findAll()
                .stream()
                .filter(interview -> interview.getInterviewDate() != null
                        && interview.getInterviewDate().isAfter(now)
                        && interview.getInterviewDate().isBefore(in24Hours))
                .toList();

        for (Interview interview : upcomingInterviews) {
            Application application = interview.getApplication();
            if (application != null && notificationRepository.existsByUserAndApplicationAndType(
                    interview.getUser(), application, NotificationType.INTERVIEW_REMINDER)) {
                continue;
            }

            String companyName = interview.getCompanyName();
            String title = "Interview Reminder - " + companyName;
            String message = "You have a " + interview.getInterviewType()
                    + " interview at " + companyName
                    + " scheduled for " + interview.getInterviewDate()
                    + ". Good luck!";

            notificationService.createNotification(
                    interview.getUser(),
                    application,
                    NotificationType.INTERVIEW_REMINDER,
                    title,
                    message,
                    interview.getInterviewDate().minusHours(2)
            );

            log.info("Interview reminder created for: {}", companyName);
        }
    }

    @Scheduled(fixedRate = 3600000, initialDelay = 1800000)
    @Transactional
    public void scheduleAssessmentReminders() {
        List<Application> scheduledAssessments = applicationRepository.findAll()
                .stream()
                .filter(application -> application.getStatus() == ApplicationStatus.ASSESSMENT_SCHEDULED)
                .toList();

        for (Application application : scheduledAssessments) {
            if (notificationRepository.existsByUserAndApplicationAndType(
                    application.getUser(), application, NotificationType.ASSESSMENT_REMINDER)) {
                continue;
            }

            notificationService.createNotification(
                    application.getUser(),
                    application,
                    NotificationType.ASSESSMENT_REMINDER,
                    "Assessment Reminder - " + application.getCompanyName(),
                    "You have an assessment scheduled for " + application.getCompanyName()
                            + ". Review the role requirements and prepare accordingly.",
                    LocalDateTime.now()
            );

            log.info("Assessment reminder created for: {}", application.getCompanyName());
        }
    }

    @Scheduled(fixedRate = 3600000, initialDelay = 1800000)
    @Transactional
    public void scheduleFollowUpReminders() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        List<Application> staleApplications = applicationRepository.findAll()
                .stream()
                .filter(application -> application.getStatus() == ApplicationStatus.APPLIED
                        && application.getLastUpdated() != null
                        && application.getLastUpdated().isBefore(sevenDaysAgo))
                .toList();

        for (Application application : staleApplications) {
            if (notificationRepository.existsByUserAndApplicationAndType(
                    application.getUser(), application, NotificationType.FOLLOW_UP_REMINDER)) {
                continue;
            }

            notificationService.createNotification(
                    application.getUser(),
                    application,
                    NotificationType.FOLLOW_UP_REMINDER,
                    "Follow-up Reminder - " + application.getCompanyName(),
                    "Your application to " + application.getCompanyName()
                            + " for " + application.getJobRole()
                            + " has had no update in 7 days. Consider following up!",
                    LocalDateTime.now()
            );
        }
    }
}
