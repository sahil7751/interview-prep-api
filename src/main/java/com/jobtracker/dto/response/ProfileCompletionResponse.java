
package com.jobtracker.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileCompletionResponse {

    private int percentage;
    private List<String> completedFields;
    private List<String> missingFields;
    private String message;
}

