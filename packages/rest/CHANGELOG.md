# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.7] - 2025-08-03

### Added

- Added `@ovendjs/utils` integration for improved debug formatting
- Added `destroy()` method to REST class for proper resource cleanup
- Added automatic bucket cleanup to prevent memory leaks
- Added `getRateLimitStatus()` method to check rate limit information for specific routes
- Added `getGlobalRateLimitStatus()` method to check global rate limit status
- Added `requestWithRetry()` method with automatic retry on rate limit errors
- Added proper error handling and logging throughout the codebase
- Added response event emissions for successful requests

### Changed

- Updated all debug events to use `@ovendjs/utils` for consistent formatting
- Improved bucket ID generation for better rate limit handling
- Enhanced error handling in Bucket and BucketManager classes
- Improved type safety throughout the codebase
- Added maximum wait time to prevent excessively long waits in rate limit scenarios

### Fixed

- Fixed potential memory leaks from uncleaned buckets
- Fixed error handling in bucket processing
- Improved type definitions with proper module declaration for `@ovendjs/utils`

## [0.0.1] - 2025-07-31

### Added

- Initial release
- Basic REST client functionality
- Rate limiting support
- Event-driven debug and response logging
- TypeScript support
