package com.vetworld.VetWorld.controller;

import com.vetworld.VetWorld.dto.BannerDto;
import com.vetworld.VetWorld.service.BannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
public class BannerController {

    private final BannerService bannerService;

    @GetMapping
    public ResponseEntity<List<BannerDto>> getAll() {
        return ResponseEntity.ok(bannerService.getAllBanners());
    }
}
