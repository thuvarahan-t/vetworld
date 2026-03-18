package com.vetworld.VetWorld.service;

import com.vetworld.VetWorld.dto.BannerDto;
import com.vetworld.VetWorld.dto.BannerRequest;
import com.vetworld.VetWorld.model.Banner;
import com.vetworld.VetWorld.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BannerService {

    private final BannerRepository bannerRepository;

    public List<BannerDto> getAllBanners() {
        return bannerRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public BannerDto createBanner(BannerRequest request) {
        Banner banner = new Banner();
        banner.setImageUrl(request.getImageUrl());
        banner.setRedirectLink(request.getRedirectLink());
        return toDto(bannerRepository.save(banner));
    }

    @Transactional
    public BannerDto updateBanner(Long id, BannerRequest request) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found with id: " + id));
        banner.setImageUrl(request.getImageUrl());
        banner.setRedirectLink(request.getRedirectLink());
        return toDto(bannerRepository.save(banner));
    }

    @Transactional
    public void deleteBanner(Long id) {
        if (!bannerRepository.existsById(id)) {
            throw new RuntimeException("Banner not found with id: " + id);
        }
        bannerRepository.deleteById(id);
    }

    public BannerDto toDto(Banner b) {
        BannerDto dto = new BannerDto();
        dto.setId(b.getId());
        dto.setImageUrl(b.getImageUrl());
        dto.setRedirectLink(b.getRedirectLink());
        dto.setCreatedAt(b.getCreatedAt());
        return dto;
    }
}
