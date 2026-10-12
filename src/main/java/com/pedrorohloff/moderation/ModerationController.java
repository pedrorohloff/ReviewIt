package com.pedrorohloff.moderation;

import com.pedrorohloff.moderation.dto.ApplyActionRequestDTO;
import com.pedrorohloff.moderation.dto.ModerationActionDTO;
import com.pedrorohloff.moderation.dto.ReportDTO;
import com.pedrorohloff.moderation.dto.ReportPageDTO;
import com.pedrorohloff.moderation.dto.ReportRequestDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/reports")
public class ModerationController {
    private final ReportService reportService;

    public ModerationController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReportDTO create(@RequestAttribute("currentUserId") UUID reporterId,
                            @RequestBody @Valid ReportRequestDTO reportRequestDTO) {
        return reportService.create(reporterId, reportRequestDTO);
    }

    @GetMapping
    public ReportPageDTO findAll(@RequestParam(defaultValue = "0") @PositiveOrZero int page,
                                 @RequestParam(defaultValue = "10") @Positive @Max(100) int pageSize) {
        return reportService.findAll(page, pageSize);
    }

    @PostMapping("/{reportId}/action")
    public ModerationActionDTO applyAction(@PathVariable @NotNull UUID reportId,
                                           @RequestAttribute("currentUserId") UUID moderatorId,
                                           @RequestBody @Valid ApplyActionRequestDTO dto) {
        return reportService.applyAction(reportId, moderatorId, dto);
    }
}
