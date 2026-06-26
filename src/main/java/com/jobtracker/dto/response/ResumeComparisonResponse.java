package com.jobtracker.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeComparisonResponse {

    private ResumeResponse resume1;
    private ResumeResponse resume2;

    private String winner; // "resume1" / "resume2" / "tie"
    private String winnerReason;

    private List<String> resume1Advantages;
    private List<String> resume2Advantages;

    private int scoreDifference;
    private String recommendation;
}

