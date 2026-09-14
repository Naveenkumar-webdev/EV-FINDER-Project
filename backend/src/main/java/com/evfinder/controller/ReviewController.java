package com.evfinder.controller;

import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.evfinder.entity.Review;
import com.evfinder.repository.ReviewRepository;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping
    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    @GetMapping("/user/{email}")
    public List<Review> getReviewsByUser(@PathVariable String email) {
        return reviewRepository.findByUserEmail(email);
    }

    @PostMapping
    public ResponseEntity<?> submitReview(@RequestBody Review review) {
        if (review.getRating() < 1 || review.getRating() > 5) {
            return ResponseEntity.badRequest().body("Rating must be between 1 and 5 stars");
        }

        if (review.getReviewDate() == null || review.getReviewDate().isEmpty()) {
            review.setReviewDate(LocalDate.now().toString());
        }

        Review savedReview = reviewRepository.save(review);
        return ResponseEntity.ok(savedReview);
    }
}
