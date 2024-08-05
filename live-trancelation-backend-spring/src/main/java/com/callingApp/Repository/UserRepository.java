package com.callingApp.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.callingApp.modle.User;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
    User findByEmail(String email);
	List<User> findByUsernameContainingIgnoreCase(String query);
	List<User> findByUsernameContaining(String query);
}
