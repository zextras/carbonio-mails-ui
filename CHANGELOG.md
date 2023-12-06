# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.11.0](https://github.com/zextras/carbonio-mails-ui/compare/v1.10.3...v1.11.0) (2023-12-05)


### Features

* added extraAccountId prop to contact input ([b881652](https://github.com/zextras/carbonio-mails-ui/commit/b8816522b500def38ee0c2e5a96913c45c4651a2))


### Bug Fixes

* allow all user accounts to be passed to the contact input ([99e1ffb](https://github.com/zextras/carbonio-mails-ui/commit/99e1ffb84dcda597bf53ec11746d584eeb492a6e))

### [1.10.3](https://github.com/zextras/carbonio-mails-ui/compare/v1.10.2...v1.10.3) (2023-11-28)


### Bug Fixes

* subject lost when read/unread the message ([061d91a](https://github.com/zextras/carbonio-mails-ui/commit/061d91a8f906f17cb5c4f1dc1ba23abb98d9397d))

### [1.10.2](https://github.com/zextras/carbonio-mails-ui/compare/v1.10.1...v1.10.2) (2023-11-23)


### Bug Fixes

* getting error while reply/forward on specific mail and not able to forward ([6b412dc](https://github.com/zextras/carbonio-mails-ui/commit/6b412dc81fd1ad243af6285a57cc00a311fc82f1))
* participant groups are correctly normalized ([3a5d1ac](https://github.com/zextras/carbonio-mails-ui/commit/3a5d1acb374fb1583cb343844e6037ca9e6a7a7f))
* save signature selection and close modal after saving settings changes ([ababe55](https://github.com/zextras/carbonio-mails-ui/commit/ababe55d96dd8880f683748d96b0992323184f1a))
* the mail editor is ignoring the mail text format setting ([3c13005](https://github.com/zextras/carbonio-mails-ui/commit/3c13005494d9ea25777e077ea01978a9315c1217))

### [1.10.1](https://github.com/zextras/carbonio-mails-ui/compare/v1.10.0...v1.10.1) (2023-11-09)

## [1.10.0](https://github.com/zextras/carbonio-mails-ui/compare/v1.9.3...v1.10.0) (2023-11-03)


### Features

* disable attachments dropzone when a contact is dragged ([5c02d1e](https://github.com/zextras/carbonio-mails-ui/commit/5c02d1eefc58969b99b9c3893f667b6732385302))
* disable attachments dropzone when a contant is being draged ([a4d5daa](https://github.com/zextras/carbonio-mails-ui/commit/a4d5daa3a7b47978b3801d068d98a242641e62ed))

### [1.9.3](https://github.com/zextras/carbonio-mails-ui/compare/v1.9.2...v1.9.3) (2023-11-03)

### [1.9.2](https://github.com/zextras/carbonio-mails-ui/compare/v1.9.1...v1.9.2) (2023-10-31)


### Bug Fixes

* restore message actions on displayer ([8533b8d](https://github.com/zextras/carbonio-mails-ui/commit/8533b8de0dea8b7fc93a9e1561c8807ed70fb840))

### [1.9.1](https://github.com/zextras/carbonio-mails-ui/compare/v1.9.0...v1.9.1) (2023-10-31)


### Bug Fixes

* fix function in folders.ts ([630d49c](https://github.com/zextras/carbonio-mails-ui/commit/630d49c5647f82927a4cd84c5996397b462cab88))

## [1.9.0](https://github.com/zextras/carbonio-mails-ui/compare/v1.8.0...v1.9.0) (2023-10-31)


### Features

* open messages and conversations in a separated browser tab ([a39d315](https://github.com/zextras/carbonio-mails-ui/commit/a39d315bfb17f7704b064c83ba60b64deeec729e))

## [1.8.0](https://github.com/zextras/carbonio-mails-ui/compare/v1.7.1...v1.8.0) (2023-10-27)


### Features

* allow user to copy-click the participants email addresses  ([86ccc03](https://github.com/zextras/carbonio-mails-ui/commit/86ccc03ed68e5aa4a6e1f213a5c0b8460a6dbc7c))


### Bug Fixes

* email filter option 'do not process additional filters' is always active ([12540be](https://github.com/zextras/carbonio-mails-ui/commit/12540be7df37e92f1b805b888fedbb570627c938))
* load conversation full content ([a2653d0](https://github.com/zextras/carbonio-mails-ui/commit/a2653d0229f2fbda2bdcf8650b824d5997a363d9))
* unnecessary first saving of the draft trigger by the editor ([6ee0f77](https://github.com/zextras/carbonio-mails-ui/commit/6ee0f7766f788a468baf9042d3d6c1ac15513d43))

### [1.7.1](https://github.com/zextras/carbonio-mails-ui/compare/v1.7.0...v1.7.1) (2023-10-12)

## [1.7.0](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.16...v1.7.0) (2023-10-03)


### Features

* enable sticky toolbar on mail editor ([2a27333](https://github.com/zextras/carbonio-mails-ui/commit/2a2733395bc914d2850434fb6e953add334a59da))

### [1.6.16](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.15...v1.6.16) (2023-09-29)


### Bug Fixes

* badge in conversation of shared folders does not always show correct number ([#423](https://github.com/zextras/carbonio-mails-ui/issues/423)) ([62e9939](https://github.com/zextras/carbonio-mails-ui/commit/62e9939a45fbe76c5e6a8fd53a1752ebc8d724c3))
* **editor:** avoid the losing of content when re-editing a draft ([0dd43cd](https://github.com/zextras/carbonio-mails-ui/commit/0dd43cd3beb8de8d56614eccb0545458a599fbfa))
* **editor:** editor breaks while editing a deletion of a calendars appointment ([#459](https://github.com/zextras/carbonio-mails-ui/issues/459)) ([296d8a1](https://github.com/zextras/carbonio-mails-ui/commit/296d8a1d759ca900006c45d0cebe9fb4a2a3a375))
* **editor:** replace the br tags added by default on top of the mails ([94e6b47](https://github.com/zextras/carbonio-mails-ui/commit/94e6b4713fb640e81b8cf2b20660fb8564fdbca3))
* memoized redux selectors ([#435](https://github.com/zextras/carbonio-mails-ui/issues/435)) ([aa1617f](https://github.com/zextras/carbonio-mails-ui/commit/aa1617f56ce7de6ed545ac01d25c83ba06a85ce0))
* when sending a message, mail From is not using from the user setting ([8fc4c98](https://github.com/zextras/carbonio-mails-ui/commit/8fc4c98cd47ce849932df2c92c2b0fac06367e2e))
* with selection mode, moving different emails in different folder having issue ([d92a496](https://github.com/zextras/carbonio-mails-ui/commit/d92a496fb0a703b885b0e965cf6d30a443d222b8))

### [1.6.15](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.14...v1.6.15) (2023-09-19)


### Bug Fixes

* fallback to default identity when no identity can be determined ([d9764e3](https://github.com/zextras/carbonio-mails-ui/commit/d9764e36e9c7a65904baf2a3ec1cc51c12c2f8f9))

### [1.6.14](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.13...v1.6.14) (2023-09-19)

### [1.6.13](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.12...v1.6.13) (2023-09-18)


### Bug Fixes

* **editor:** change upload and save attachment logic ([1f8589c](https://github.com/zextras/carbonio-mails-ui/commit/1f8589c566639df1cf262fe71c6a2c7646246235))
* **editor:** fix the src transformation for inline images ([7b06730](https://github.com/zextras/carbonio-mails-ui/commit/7b067307ce430934c2d6b9e1d89c410a17226ef1))

### [1.6.12](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.11...v1.6.12) (2023-09-15)


### Bug Fixes

* fixed height of attachments row in expanded editor ([a3f347e](https://github.com/zextras/carbonio-mails-ui/commit/a3f347ed69b725eb0f294f4be8fd0e0c93f0211d))

### [1.6.11](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.10...v1.6.11) (2023-09-14)

### [1.6.10](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.9...v1.6.10) (2023-09-13)


### Bug Fixes

* editor generate fail on draft double click ([b3e72f8](https://github.com/zextras/carbonio-mails-ui/commit/b3e72f819ff6e40d6ec81f2d15256bae2b07cea2))
* **Editor:** align the editor loader ([2881ea3](https://github.com/zextras/carbonio-mails-ui/commit/2881ea3f8fc36b04804d8c4ea69129721ddcc239))
* **editor:** avoid errors during the editor creation if the referred message is not in the store ([c2f9a35](https://github.com/zextras/carbonio-mails-ui/commit/c2f9a35b36bf31eecbca20cf85b44a5c0e4f6675))
* **editor:** avoid errors during the editor creation if the referred message is not in the store ([cb79796](https://github.com/zextras/carbonio-mails-ui/commit/cb79796634e35d6bce16f24d75d24e37c14a10f0))

### [1.6.9](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.8...v1.6.9) (2023-09-13)


### Bug Fixes

* filtering From and To will display correctly the chips ([a3b3219](https://github.com/zextras/carbonio-mails-ui/commit/a3b321991da3a640f7066d0dbda42ac08b6a73b8))

### [1.6.8](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.7...v1.6.8) (2023-09-11)


### Bug Fixes

* progress save ([06138a9](https://github.com/zextras/carbonio-mails-ui/commit/06138a960f991eb72a4ac57e4998b05b7b9e1699))
* recognize inline attachment without content disposition ([c2ce311](https://github.com/zextras/carbonio-mails-ui/commit/c2ce311eae0b6da53e7fc49bf23837ef79ad88bb))

### [1.6.7](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.6...v1.6.7) (2023-09-11)


### Bug Fixes

* advanced search pass wrong value in folder chip ([703991e](https://github.com/zextras/carbonio-mails-ui/commit/703991ec3b0fa3ab3895f8405056981b5add6ad8))

### [1.6.6](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.5...v1.6.6) (2023-09-11)


### Bug Fixes

* fix conversations sync ([9595c31](https://github.com/zextras/carbonio-mails-ui/commit/9595c310a1379be6d226ab09167f401190e9e88c))

### [1.6.5](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.4...v1.6.5) (2023-09-11)


### Bug Fixes

* print email headers ([b9719ae](https://github.com/zextras/carbonio-mails-ui/commit/b9719aeac17d788a450b87a4189e399ff3ef685d))

### [1.6.4](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.3...v1.6.4) (2023-09-06)


### Bug Fixes

* **editor:** email send with delay set to 0 ([ae68a5a](https://github.com/zextras/carbonio-mails-ui/commit/ae68a5aeca98e7814cf64864aa8ac6ad80329c87))

### [1.6.3](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.2...v1.6.3) (2023-09-06)

### [1.6.2](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.1...v1.6.2) (2023-09-01)


### Bug Fixes

* filter with To condition not working ([27e248d](https://github.com/zextras/carbonio-mails-ui/commit/27e248dadf8a27333962f167b80541c776db077d))
* fix typescript errors ([f9d13d0](https://github.com/zextras/carbonio-mails-ui/commit/f9d13d018db0b307169eab65f8fdfba34f5c00da))
* missing chevron in conversation container in shared folder ([436deff](https://github.com/zextras/carbonio-mails-ui/commit/436deff4c0c07033f38eeff35a4ca27d0eebb927))
* visualization by message doesn't work on shared folder ([d30901d](https://github.com/zextras/carbonio-mails-ui/commit/d30901d8ec1fca749b1ec822e299c1b61b914b92))

### [1.6.1](https://github.com/zextras/carbonio-mails-ui/compare/v1.6.0...v1.6.1) (2023-07-20)

## [1.6.0](https://github.com/zextras/carbonio-mails-ui/compare/v1.5.0...v1.6.0) (2023-07-06)


### Features

* added attachment list to print page ([#392](https://github.com/zextras/carbonio-mails-ui/issues/392)) ([c2bb2c0](https://github.com/zextras/carbonio-mails-ui/commit/c2bb2c0b3a68c5f949e291eb825ec218792064d8))
* added test for deletion of folder in shared account ([a193d78](https://github.com/zextras/carbonio-mails-ui/commit/a193d78bee434f452ad25de4e006db410a01a0bd))
* helper text in case of empty calendar name inside response-actions ([a2f3887](https://github.com/zextras/carbonio-mails-ui/commit/a2f3887e8471616daf23bf12cf8c13192bcbbc05))


### Bug Fixes

* add changes to update to latest types from Shell ([8d45734](https://github.com/zextras/carbonio-mails-ui/commit/8d45734613f0a9f88c94e332c4374b37ba4c6b6f))
* displaying an error when user tries to create folder with non allowed characters ([#386](https://github.com/zextras/carbonio-mails-ui/issues/386)) ([ea9244e](https://github.com/zextras/carbonio-mails-ui/commit/ea9244ee11b8fb9ea6f7fa990cbabcf756ddea33))
* fix conversation list prop ([#407](https://github.com/zextras/carbonio-mails-ui/issues/407)) ([69fc298](https://github.com/zextras/carbonio-mails-ui/commit/69fc2983c1394b57b163b6c5779b7c5250f6474a))
* fix delete of folder in shared accounts ([0486f8e](https://github.com/zextras/carbonio-mails-ui/commit/0486f8eba4f397aa24d35a9a955bc3561dce3484))
* fixed system folder translated name in move modal ([#394](https://github.com/zextras/carbonio-mails-ui/issues/394)) ([783d532](https://github.com/zextras/carbonio-mails-ui/commit/783d53291fe99e797f3fe3d1c51ac33bdcb34d51))
* folder name validation should be skip on system folder edit ([f4c1a5f](https://github.com/zextras/carbonio-mails-ui/commit/f4c1a5f962efc38cb6018a1f1382e2e6f9616ca6))
* managed shared account folder's actions as per rights ([b297db0](https://github.com/zextras/carbonio-mails-ui/commit/b297db037e5ee1aac84ffb40e36968cb59930b19))
* response handling for 'save to files' ([d9fbb40](https://github.com/zextras/carbonio-mails-ui/commit/d9fbb400f7306c7d51373daa68d97440535b0bbf))
* search results cannot be endlessly scrolled ([94dd274](https://github.com/zextras/carbonio-mails-ui/commit/94dd2742bd9ac5f5f1d6847b8724bfc3572bd5e7))
* shared accounts view for draft and trash folder is set to message ([#402](https://github.com/zextras/carbonio-mails-ui/issues/402)) ([7c96927](https://github.com/zextras/carbonio-mails-ui/commit/7c96927dc515e095554b53a90ebe26068201c5f9))
* sharing folder set 'send notification about this shared' is checked by default ([645b852](https://github.com/zextras/carbonio-mails-ui/commit/645b852014db3d6385eb8010142911e13c1fe2fc))
* wrong condition of item name inside  share calendar mail ([0167e7b](https://github.com/zextras/carbonio-mails-ui/commit/0167e7bc418850f4395f14ae3ef4682080f156f1))

## [1.5.0](https://github.com/zextras/carbonio-mails-ui/compare/v1.4.2...v1.5.0) (2023-06-07)


### Features

* add messages helper functions ([c6ec53e](https://github.com/zextras/carbonio-mails-ui/commit/c6ec53e36ac151eaba20976a8ecc219b90e4d934))


### Bug Fixes

* avoid crash when selecting the move action on a linked folder message ([0d84af9](https://github.com/zextras/carbonio-mails-ui/commit/0d84af95be27b22ad06cfad75b274e0ca9c2e52c))

### [1.4.2](https://github.com/zextras/carbonio-mails-ui/compare/v1.4.1...v1.4.2) (2023-06-05)


### Bug Fixes

* fixed undo button ([2553f46](https://github.com/zextras/carbonio-mails-ui/commit/2553f468408cac4ab6764a48f6ae4132415223f3))

### [1.4.1](https://github.com/zextras/carbonio-mails-ui/compare/v1.4.0...v1.4.1) (2023-05-31)


### Bug Fixes

* fixed messages not displaying in shared with me folders ([bbe4fcb](https://github.com/zextras/carbonio-mails-ui/commit/bbe4fcbf5f1bdda6c19e87dc29d1506d44d7563f))

## [1.4.0](https://github.com/zextras/carbonio-mails-ui/compare/v1.3.6...v1.4.0) (2023-05-25)


### Features

* added restore action to trash folder ([#376](https://github.com/zextras/carbonio-mails-ui/issues/376)) ([12a37ed](https://github.com/zextras/carbonio-mails-ui/commit/12a37edec46a9a7e9146112079a9731f0815a9c4))


### Bug Fixes

* fix badge update ([#374](https://github.com/zextras/carbonio-mails-ui/issues/374)) ([6dbc852](https://github.com/zextras/carbonio-mails-ui/commit/6dbc852f49c9a6aa7ee0bc4bf8aa2f04fcdb76ca))
* fix display of messages in shared folders ([#373](https://github.com/zextras/carbonio-mails-ui/issues/373)) ([fd0fa71](https://github.com/zextras/carbonio-mails-ui/commit/fd0fa715abd078357d6cd96183867a1e1c06cb62))
* fix the folder selector filter behaviour ([424f989](https://github.com/zextras/carbonio-mails-ui/commit/424f98961f591798449cddf6f6cb0183485bf5f0))
* lists renders only visible items ([#377](https://github.com/zextras/carbonio-mails-ui/issues/377)) ([4f6c0d3](https://github.com/zextras/carbonio-mails-ui/commit/4f6c0d3a32f950ca2ac86adae02daa8a38ea7dae))

### [1.3.6](https://github.com/zextras/carbonio-mails-ui/compare/v1.3.5...v1.3.6) (2023-05-11)

### [1.3.5](https://github.com/zextras/carbonio-mails-ui/compare/v1.3.4...v1.3.5) (2023-05-11)


### Bug Fixes

* fix move of list items in shared accounts ([5bb6230](https://github.com/zextras/carbonio-mails-ui/commit/5bb6230fca5dddeaa3547726fc2607b571eb82ce))

### [1.3.4](https://github.com/zextras/carbonio-mails-ui/compare/v1.3.3...v1.3.4) (2023-05-10)


### Bug Fixes

* fix function import in sync ([515c94d](https://github.com/zextras/carbonio-mails-ui/commit/515c94d645f48802ab09816fa50742dfa208ee82))

### [1.3.3](https://github.com/zextras/carbonio-mails-ui/compare/v1.3.2...v1.3.3) (2023-05-09)


### Bug Fixes

* fix drag and drop behavior ([3122c26](https://github.com/zextras/carbonio-mails-ui/commit/3122c26f4d8e251584b5eb236e1db09f00e1236b))
* fix move of list items in search module ([a4c0c2e](https://github.com/zextras/carbonio-mails-ui/commit/a4c0c2e10a81c5b536c301b6ff40a9db1179e076))

### [1.3.2](https://github.com/zextras/carbonio-mails-ui/compare/v1.3.1...v1.3.2) (2023-04-27)


### Bug Fixes

* fix export settings view ([#337](https://github.com/zextras/carbonio-mails-ui/issues/337)) ([b46f7ef](https://github.com/zextras/carbonio-mails-ui/commit/b46f7ef9856bc5d63715730ccba59b5fb4bbed7d))
* fix onclick ([#356](https://github.com/zextras/carbonio-mails-ui/issues/356)) ([8218d08](https://github.com/zextras/carbonio-mails-ui/commit/8218d08891fc289e8d8b09160eb5a11a59189d75))
* missing translations issus fixed ([#354](https://github.com/zextras/carbonio-mails-ui/issues/354)) ([aa03aa0](https://github.com/zextras/carbonio-mails-ui/commit/aa03aa0e7f7e6f98fb1fb6fb115c4aefd966d5b5))
* translate label for search module selector ([aebfa02](https://github.com/zextras/carbonio-mails-ui/commit/aebfa028fa1c3e2f10fc508d2a7f128ae573792a))
* truncated text in email displayer ([#355](https://github.com/zextras/carbonio-mails-ui/issues/355)) ([2d87d92](https://github.com/zextras/carbonio-mails-ui/commit/2d87d92c7fe00ddacfd4dfedcb26249a383b0685))

### [1.3.1](https://github.com/zextras/carbonio-mails-ui/compare/v1.3.0...v1.3.1) (2023-04-13)

## [1.3.0](https://github.com/zextras/carbonio-mails-ui/compare/v1.2.5...v1.3.0) (2023-04-07)


### Features

* managed the redirectToAddress action in filters as per permission ([c6c3c17](https://github.com/zextras/carbonio-mails-ui/commit/c6c3c1718a7085c8881403bd6c8c62a147955122))

### [1.2.5](https://github.com/zextras/carbonio-mails-ui/compare/v1.2.4...v1.2.5) (2023-04-07)


### Bug Fixes

* hotfix mail preview flicker ([2531201](https://github.com/zextras/carbonio-mails-ui/commit/253120114e29a96c2642c7a7ebd2ac9f459a2feb))

### [1.2.4](https://github.com/zextras/carbonio-mails-ui/compare/v1.2.3...v1.2.4) (2023-03-30)


### Bug Fixes

* close displayer on clear search ([73362cb](https://github.com/zextras/carbonio-mails-ui/commit/73362cb6ae4666cff7e0eca3faf51f1f4fbdd6f6))
* scrollbar is not resetting between different folders ([8ba2de3](https://github.com/zextras/carbonio-mails-ui/commit/8ba2de3470911db37ba337b6bb1f8ea7f3d73151))

### [1.2.3](https://github.com/zextras/carbonio-mails-ui/compare/v1.2.2...v1.2.3) (2023-03-16)


### Bug Fixes

* editor not reflacted with the add public link from files ([3fcbbbb](https://github.com/zextras/carbonio-mails-ui/commit/3fcbbbbe5ceae2a0390efd20074d907ef95b4fa2))

### [1.2.2](https://github.com/zextras/carbonio-mails-ui/compare/v1.2.1...v1.2.2) (2023-03-15)

### [1.2.1](https://github.com/zextras/carbonio-mails-ui/compare/v1.2.0...v1.2.1) (2023-03-13)


### Bug Fixes

* avoid content duplication when edit a draft ([4721831](https://github.com/zextras/carbonio-mails-ui/commit/472183172856414964b07b67bd29aa07ada4cec3))
* escape possible html tags in reply/forward heading ([71af9fd](https://github.com/zextras/carbonio-mails-ui/commit/71af9fd9291ebdfbf1f33362f70c7a6093eac56f))

## [1.2.0](https://github.com/zextras/carbonio-mails-ui/compare/v1.1.2...v1.2.0) (2023-03-02)


### Features

* open EML attachments in a new tab  ([#310](https://github.com/zextras/carbonio-mails-ui/issues/310)) ([5321430](https://github.com/zextras/carbonio-mails-ui/commit/53214301c64ca936e2b7db046f6ac17fe2b153c9))
* setting signatures for identities ([#299](https://github.com/zextras/carbonio-mails-ui/issues/299)) ([9cd49d7](https://github.com/zextras/carbonio-mails-ui/commit/9cd49d7e5a06e7737c92f7d9165ada1e7c4d1256))
* updating files integration ([b083375](https://github.com/zextras/carbonio-mails-ui/commit/b083375f4f2cd71747ee4808be42ccf1693ec976))


### Bug Fixes

* clone the identity object ([59ddc03](https://github.com/zextras/carbonio-mails-ui/commit/59ddc03025fecbb4ec5d9cd78e9877f927a32689))
* focus background not applied on list ([#298](https://github.com/zextras/carbonio-mails-ui/issues/298)) ([0cd4916](https://github.com/zextras/carbonio-mails-ui/commit/0cd4916c33b0e1727dbf1240c643542e3b869d0f))
* proper redirection on notification popup click ([6dbf6ac](https://github.com/zextras/carbonio-mails-ui/commit/6dbf6acde88364206500ab4fa1cfb1d159b61ee2))
* status label change in advance search ([2fe6fa1](https://github.com/zextras/carbonio-mails-ui/commit/2fe6fa153408712eedfd877b7443dbb8a1e51adb))

### [1.1.2](https://github.com/zextras/carbonio-mails-ui/compare/v1.1.1...v1.1.2) (2023-02-10)


### Bug Fixes

* handle errors during message sending ([95ddeea](https://github.com/zextras/carbonio-mails-ui/commit/95ddeeae9df8662c9c7fff4b80cea8c9f6bf06e3))

### [1.1.1](https://github.com/zextras/carbonio-mails-ui/compare/v1.1.0...v1.1.1) (2023-02-10)


### Bug Fixes

* default identity selection where replying ([98c6745](https://github.com/zextras/carbonio-mails-ui/commit/98c67456890bd1c648516c4a5a0393558713ecf9))

## [1.1.0](https://github.com/zextras/carbonio-mails-ui/compare/v1.0.0...v1.1.0) (2023-02-02)


### Features

* added download section to preview-eml ([#291](https://github.com/zextras/carbonio-mails-ui/issues/291)) ([55491d6](https://github.com/zextras/carbonio-mails-ui/commit/55491d68a232f381dfd8fdc024264fbaa0a27e3e))


### Bug Fixes

* block download for untrusted images ([#295](https://github.com/zextras/carbonio-mails-ui/issues/295)) ([16c8176](https://github.com/zextras/carbonio-mails-ui/commit/16c8176f5d2bfebff252aaae78fe82237502f7f2))
* force draft opening on board ([89d5c25](https://github.com/zextras/carbonio-mails-ui/commit/89d5c25465bbd8069c741512a6c45bd05ab1da92))
* keep sender set on draft ([5198b55](https://github.com/zextras/carbonio-mails-ui/commit/5198b55cb00172a1c7efe4c4db8d9bc7953ebc8c))
* tag search not working issue fixed ([#288](https://github.com/zextras/carbonio-mails-ui/issues/288)) ([92532f7](https://github.com/zextras/carbonio-mails-ui/commit/92532f75a49f1c02b2d62209eda317e4066b5323))

## [1.0.0](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.56...v1.0.0) (2023-01-18)

### [0.1.56](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.55...v0.1.56) (2023-01-10)


### Features

* autoselection of sender ([0c72442](https://github.com/zextras/carbonio-mails-ui/commit/0c72442a1f43e69a674af4af1f889681dda3f49f))


### Bug Fixes

* default identity selection ([0e078e4](https://github.com/zextras/carbonio-mails-ui/commit/0e078e44ba3ad74908b8027e3c13a176bceef50a))

### [0.1.55](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.54...v0.1.55) (2023-01-05)


### Features

* added attachment section on preview email ([#284](https://github.com/zextras/carbonio-mails-ui/issues/284)) ([c2def3f](https://github.com/zextras/carbonio-mails-ui/commit/c2def3f8b84f2f0e2cf08a4ae1e4b32aa5aa1724))
* added react hook testing library dependency ([612c837](https://github.com/zextras/carbonio-mails-ui/commit/612c837421e2298a06fa0fb3ca866483f255f0e9))
* forced email edit on board only ([#274](https://github.com/zextras/carbonio-mails-ui/issues/274)) ([fc1f98c](https://github.com/zextras/carbonio-mails-ui/commit/fc1f98c7dc075ed2e5214ad7c71c2b746429f210))


### Bug Fixes

*  fixed missing share list on folder property ([#270](https://github.com/zextras/carbonio-mails-ui/issues/270)) ([fefac23](https://github.com/zextras/carbonio-mails-ui/commit/fefac233b03ecf9e64bc62d44fc5de78e691dcf0))
* edit of filters is deleting the current condition ([#255](https://github.com/zextras/carbonio-mails-ui/issues/255)) ([c95f8ad](https://github.com/zextras/carbonio-mails-ui/commit/c95f8ad63e315f98217b5d17906ce9c65e978a65))
* email attachment check for 'attachments' words ([#285](https://github.com/zextras/carbonio-mails-ui/issues/285)) ([a4c0a02](https://github.com/zextras/carbonio-mails-ui/commit/a4c0a02aae82562081909a879c82e41cb93fffc4))
* filter redirect action fixed and added tooltip for create ([#275](https://github.com/zextras/carbonio-mails-ui/issues/275)) ([24c96cc](https://github.com/zextras/carbonio-mails-ui/commit/24c96cc40a261b46760b25b6471d2ea448851f13))
* fix issue of send later feature broken ([#283](https://github.com/zextras/carbonio-mails-ui/issues/283)) ([214d878](https://github.com/zextras/carbonio-mails-ui/commit/214d8781f455a0c9dcc9e85a74a74ee99a48b3e6))

### [0.1.54](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.53...v0.1.54) (2022-12-07)


### Bug Fixes

* restored previous version of normalize-message ([3312412](https://github.com/zextras/carbonio-mails-ui/commit/3312412e9065154ad87d703204c7953a04b66da4))
* restored previous version of normalize-message ([9531c5e](https://github.com/zextras/carbonio-mails-ui/commit/9531c5ee8edbb5a0159240af77e1f9768708451a))

### [0.1.53](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.52...v0.1.53) (2022-12-06)


### Bug Fixes

* undo trashing an email raise an error and doesn't restore email ([f3e21f7](https://github.com/zextras/carbonio-mails-ui/commit/f3e21f71162e8a5b53d53803de0b0bb804e0d06e))

### [0.1.52](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.51...v0.1.52) (2022-12-05)


### Bug Fixes

* restore signatures broken settings ([d5be0ce](https://github.com/zextras/carbonio-mails-ui/commit/d5be0cea3823297ad4fcecd823efb7748929e8a8))

### [0.1.51](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.50...v0.1.51) (2022-11-30)


### Bug Fixes

* fixed inline attachments ([f014402](https://github.com/zextras/carbonio-mails-ui/commit/f014402bd8fa281fdadb1f78bd9d0ae7872f493c))

### [0.1.50](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.49...v0.1.50) (2022-11-24)

### [0.1.49](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.48...v0.1.49) (2022-11-16)


### Features

* convert px to rem ([#225](https://github.com/zextras/carbonio-mails-ui/issues/225)) ([1a176ae](https://github.com/zextras/carbonio-mails-ui/commit/1a176ae50f844e2b8d187d01009409e53d779a82))
* refactor board composer experience by changing the 'from' selector ([#245](https://github.com/zextras/carbonio-mails-ui/issues/245)) ([48e5f0e](https://github.com/zextras/carbonio-mails-ui/commit/48e5f0eecd9836ec256cfb4da4c882168806d906))


### Bug Fixes

* default unsend time ([4c8cd95](https://github.com/zextras/carbonio-mails-ui/commit/4c8cd9507bc8b35d165909ca3e3792f09c401cf1))
* folder path passed instead of name for move filter ([#246](https://github.com/zextras/carbonio-mails-ui/issues/246)) ([231be69](https://github.com/zextras/carbonio-mails-ui/commit/231be693dfed13ce470c2200f671a158905a8d05))
* hardcoded translations removed ([#251](https://github.com/zextras/carbonio-mails-ui/issues/251)) ([146609b](https://github.com/zextras/carbonio-mails-ui/commit/146609bd4960e5612b63504468b09facc0c8e6d6))

### [0.1.48](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.47...v0.1.48) (2022-11-09)

### [0.1.47](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.46...v0.1.47) (2022-11-08)


### Bug Fixes

* default unsend time to 3 sec ([962c588](https://github.com/zextras/carbonio-mails-ui/commit/962c588906c37f39e69cc30ffc36d45f57f453a5))

### [0.1.46](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.45...v0.1.46) (2022-10-27)


### Bug Fixes

* fix attachment icon color ([4787c41](https://github.com/zextras/carbonio-mails-ui/commit/4787c419b47f07f1cda1c9d9080be02498c84bd3))

### [0.1.45](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.44...v0.1.45) (2022-10-26)


### Features

* added a message slice test ([1d8829c](https://github.com/zextras/carbonio-mails-ui/commit/1d8829ca07a9cad5e4d419d56c7d43626fca565d))
* collapse board on send, send time options ([#223](https://github.com/zextras/carbonio-mails-ui/issues/223)) ([e6297d2](https://github.com/zextras/carbonio-mails-ui/commit/e6297d22698c8794dccfe4f1894aa3950f3c31a5))
* integrating commons module changes ([ba2d78f](https://github.com/zextras/carbonio-mails-ui/commit/ba2d78f6b4056c1c26be707ec6d627970c977701))


### Bug Fixes

* close board on sending appointment cancellation ([4cf4e81](https://github.com/zextras/carbonio-mails-ui/commit/4cf4e81fc9548f9302fa8c16961e3393c8f4713d))
* disable mark all as read action for draft folder ([bab403e](https://github.com/zextras/carbonio-mails-ui/commit/bab403ee11f04f39671bb3554fc8bf4037d3d537))
* fixed drag and drop of list items in shared folders and accounts ([#231](https://github.com/zextras/carbonio-mails-ui/issues/231)) ([bc1b1a3](https://github.com/zextras/carbonio-mails-ui/commit/bc1b1a3aa384edba1c2d005ed914c4f748311304))
* fixed scrollbar on displayer ([#233](https://github.com/zextras/carbonio-mails-ui/issues/233)) ([17af49d](https://github.com/zextras/carbonio-mails-ui/commit/17af49de317d9d0872fbbbb805d6b614daab0f9c))
* flag appears like applied when not applied on email ([#228](https://github.com/zextras/carbonio-mails-ui/issues/228)) ([aea5ec6](https://github.com/zextras/carbonio-mails-ui/commit/aea5ec6ad1e7c2cd981a6a5c8d78f8fdac85355a))
* label rendered instead of name for tag ([97bcbbb](https://github.com/zextras/carbonio-mails-ui/commit/97bcbbb7b1025828c496610833e10369c3eeb315))
* lists sometimes breaks the view ([0411ad3](https://github.com/zextras/carbonio-mails-ui/commit/0411ad36ec7eafa4fbed21d8a56439c9bbdc03a0))
* missing attachments ([#227](https://github.com/zextras/carbonio-mails-ui/issues/227)) ([3638acd](https://github.com/zextras/carbonio-mails-ui/commit/3638acd224376eb938babc6f82bae7fc58a6acf9))
* send draft action fixed ([ca71128](https://github.com/zextras/carbonio-mails-ui/commit/ca71128d88aef2964678adf0b9d754fa5c68cd41))

### [0.1.44](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.43...v0.1.44) (2022-10-14)

### [0.1.43](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.42...v0.1.43) (2022-10-12)

### [0.1.42](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.41...v0.1.42) (2022-10-07)


### Bug Fixes

* aligned divider attribute of accordions to new DS ([2a16b36](https://github.com/zextras/carbonio-mails-ui/commit/2a16b366edbc65d55c02f5bc8147867d131c9d13))

### [0.1.41](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.40...v0.1.41) (2022-10-06)


### Bug Fixes

* draft modal won't open on send later ([d306c01](https://github.com/zextras/carbonio-mails-ui/commit/d306c01fa97eee0cd2393ec44224346d7ca8ebcf))

### [0.1.40](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.39...v0.1.40) (2022-10-05)


### Bug Fixes

* added close action fo  edit scheduled message warning modal ([a96e41f](https://github.com/zextras/carbonio-mails-ui/commit/a96e41f9877392713618f481409527808bf156a0))

### [0.1.39](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.38...v0.1.39) (2022-10-05)


### Bug Fixes

* inline attachments ([cc88db9](https://github.com/zextras/carbonio-mails-ui/commit/cc88db97c6b60f96a05600becbbd855608e86e73))

### [0.1.38](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.37...v0.1.38) (2022-10-03)


### Bug Fixes

* mark all as read on folders contextual menu ([a3c629a](https://github.com/zextras/carbonio-mails-ui/commit/a3c629af181a00a8ee1f77197125068409ca2edd))
* mark all as read on folders contextual menu ([29348ec](https://github.com/zextras/carbonio-mails-ui/commit/29348ec3a15f7ede1de6fece84df4ec0126aff7e))
* sometimes when draft is created, editor id is not updated ([6ccbd6d](https://github.com/zextras/carbonio-mails-ui/commit/6ccbd6def0d05b6839694abdccdd408f978ae0a2))
* synk normalization error ([352cd66](https://github.com/zextras/carbonio-mails-ui/commit/352cd6663700b8c8bc98be4ef7f55faa9eaa520a))
* when sending email from board the draft modal is not appearing ([2cf4ca4](https://github.com/zextras/carbonio-mails-ui/commit/2cf4ca4d304a6eb3136d45518ac18dda73bd1c07))

### [0.1.37](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.36...v0.1.37) (2022-09-29)


### Bug Fixes

* restore the folders list in move modal of the filter ([b45a7b0](https://github.com/zextras/carbonio-mails-ui/commit/b45a7b0fbf0c45a7c2dfdae330b1d3b8f4886cfa))

### [0.1.36](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.35...v0.1.36) (2022-09-28)


### Features

* delete draft modal in board ([#192](https://github.com/zextras/carbonio-mails-ui/issues/192)) ([460533a](https://github.com/zextras/carbonio-mails-ui/commit/460533a7440c8535ff1668d8c05c654051929410))
* eml  preview implemented ([#189](https://github.com/zextras/carbonio-mails-ui/issues/189)) ([3ac3d42](https://github.com/zextras/carbonio-mails-ui/commit/3ac3d42460122a026bd17aa49cb9196799471c0e))


### Bug Fixes

* color and size of message action icons ([#197](https://github.com/zextras/carbonio-mails-ui/issues/197)) ([8317892](https://github.com/zextras/carbonio-mails-ui/commit/83178926d31a1754c604d1bbc9e92035a332bcb5))
* composer modal if attachment word present and file attached is missing ([9b1c50c](https://github.com/zextras/carbonio-mails-ui/commit/9b1c50c5bfea49f172842e1f1c1bf28f9120e842))
* custom message is missing on calendar share ([1cf5833](https://github.com/zextras/carbonio-mails-ui/commit/1cf58330f65c91ae0cab01799649be9b3838ce28))
* delete parent folders ([e7ca2be](https://github.com/zextras/carbonio-mails-ui/commit/e7ca2be0360f27af57a16e24d0a6afdf15a02f08))
* graphical fix to sidebar ([#194](https://github.com/zextras/carbonio-mails-ui/issues/194)) ([67c9bf1](https://github.com/zextras/carbonio-mails-ui/commit/67c9bf1e797b7f9983bb4f2a292ef210df082b69))
* mark all as read on folders contextual menu ([#193](https://github.com/zextras/carbonio-mails-ui/issues/193)) ([bc54e92](https://github.com/zextras/carbonio-mails-ui/commit/bc54e9245db953ea4db937a19ce617a19f6d41cf))
* modals have their own providers ([79dba81](https://github.com/zextras/carbonio-mails-ui/commit/79dba810b363c264019bccfc73cd4bdc884d73cc))
* reset expandedStatus for re-triggering conversation fetch ([2d552b6](https://github.com/zextras/carbonio-mails-ui/commit/2d552b663380295a3c73d77a46361014ade261b1))
* restore visibility of deleted mails on shared accounts ([93f0394](https://github.com/zextras/carbonio-mails-ui/commit/93f0394f46fc7d44afea9ca239c466b1181e9d0c))
* restored preview of email with attachments ([ad6a877](https://github.com/zextras/carbonio-mails-ui/commit/ad6a8773272dbd0966215a37a7c5486ee990ff98))
* restored preview of emails with attachments ([a153111](https://github.com/zextras/carbonio-mails-ui/commit/a153111e4cf11c53ffa23f486ecf1d3832651b0f))
* restored settings view ([5d43958](https://github.com/zextras/carbonio-mails-ui/commit/5d439580941579a2cef1d25eda80506648e36669))
* sidebar performance improvements ([#169](https://github.com/zextras/carbonio-mails-ui/issues/169)) ([0430d3e](https://github.com/zextras/carbonio-mails-ui/commit/0430d3eeb9c9456554e0ef8cecc3843094652b31))
* signature image is removed from draft mail ([bfabafa](https://github.com/zextras/carbonio-mails-ui/commit/bfabafa5687b33de2cc49b3508416f837534730c))

### [0.1.35](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.34...v0.1.35) (2022-09-16)


### Bug Fixes

* close displayer after send later successfull action ([f8edabb](https://github.com/zextras/carbonio-mails-ui/commit/f8edabb53fb967530f7a8d0349c758c84f271702))

### [0.1.34](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.33...v0.1.34) (2022-09-15)

### [0.1.33](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.32...v0.1.33) (2022-09-15)


### Features

* added support for documental preview ([fd38a28](https://github.com/zextras/carbonio-mails-ui/commit/fd38a281f85e90e198f4ad4f71e85e4f00fc3804))

### [0.1.32](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.31...v0.1.32) (2022-09-01)


### Bug Fixes

* missing prefs pass to onConfirm action ([955adb7](https://github.com/zextras/carbonio-mails-ui/commit/955adb7b43b0c332b0261379ae902af0d15c7f65))

### [0.1.31](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.30...v0.1.31) (2022-08-31)


### Features

* correct identity on reply ([5a280f9](https://github.com/zextras/carbonio-mails-ui/commit/5a280f9017a71035fdba5616d0b08353a03301cf))
* default font size setting for email composition ([1651ff3](https://github.com/zextras/carbonio-mails-ui/commit/1651ff3b6be5968b87fbf7bf8791740954a864be))
* managed the trash elements in search result ([#158](https://github.com/zextras/carbonio-mails-ui/issues/158)) ([625354c](https://github.com/zextras/carbonio-mails-ui/commit/625354c8af746681a130d381c5881a3713632fe6))
* remove mail ordering param on search result ([30e7f31](https://github.com/zextras/carbonio-mails-ui/commit/30e7f31bb71c98760e1f536b9a6c0f7499e12a6f))
* trustee address list setting added ([1e574cd](https://github.com/zextras/carbonio-mails-ui/commit/1e574cd1b4cb6d0cfdfd03515b513f185da6a908))
* warning for missing subject or attachment ([b7b339c](https://github.com/zextras/carbonio-mails-ui/commit/b7b339cbe4fa73111109dabc8c0b98622c7e1f75))


### Bug Fixes

* accept shared calendar with existing name handled ([bab131b](https://github.com/zextras/carbonio-mails-ui/commit/bab131bf527c7e9c7e1aa03612fbafc5692b5281))
* accordionItem correct width in sidebar component ([5572b58](https://github.com/zextras/carbonio-mails-ui/commit/5572b58d23d278a19ff4e6f4a6dbe048f45e4193))
* fix editor mail composer ([e0d9e21](https://github.com/zextras/carbonio-mails-ui/commit/e0d9e21518ca612f7e1e85724f594a3502388cdb))
* improved usage of composer values ([2fa52e9](https://github.com/zextras/carbonio-mails-ui/commit/2fa52e927486f096fdf2f0500039b139978dfaf5))
* shared with information on edit folder modal ([b4ff3b8](https://github.com/zextras/carbonio-mails-ui/commit/b4ff3b839f1421f87fef681dd15d034dac481ca8))
* switching between email sender and receiver ([1e05291](https://github.com/zextras/carbonio-mails-ui/commit/1e052913589152528883dd3b04c7ba92c8cac4bc))
* trustee setting order and regex updated ([941ee5d](https://github.com/zextras/carbonio-mails-ui/commit/941ee5d8e0aee94400c9c675fdd06e7a4fa307a8))

### [0.1.30](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.29...v0.1.30) (2022-08-17)


### Bug Fixes

* condition for showing button and preselect on reply ([b443424](https://github.com/zextras/carbonio-mails-ui/commit/b443424115716ae99a6a62f75499f30d930fa28d))
* condition for showing button and preselect on reply ([ddd46af](https://github.com/zextras/carbonio-mails-ui/commit/ddd46afbd589fb0b0c6079e6a373cd67a02ef6d5))

### [0.1.29](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.28...v0.1.29) (2022-08-05)


### Bug Fixes

* correct identity on reply ([66cbfd1](https://github.com/zextras/carbonio-mails-ui/commit/66cbfd167817c1ddd669da34a793cbc9fb751504))

### [0.1.28](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.27...v0.1.28) (2022-08-05)


### Bug Fixes

* attachment preview with shared folder broken ([7edee69](https://github.com/zextras/carbonio-mails-ui/commit/7edee69fdaf9588da394a0ae88d34beb67376296))

### [0.1.27](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.26...v0.1.27) (2022-08-01)

### [0.1.26](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.25...v0.1.26) (2022-07-22)


### Features

* added confirm dialog to delete or save draft while closing the … ([#115](https://github.com/zextras/carbonio-mails-ui/issues/115)) ([af4f7e1](https://github.com/zextras/carbonio-mails-ui/commit/af4f7e1e28bda236fe536982a3c7b9965157f41b))
* added search filter to choose shared account ([#127](https://github.com/zextras/carbonio-mails-ui/issues/127)) ([9bf1df4](https://github.com/zextras/carbonio-mails-ui/commit/9bf1df420e07479ad7f571e75d90f6db18c1ab53))
* mail request read receipt implemented ([73b6732](https://github.com/zextras/carbonio-mails-ui/commit/73b6732544a87f3036247fe176b98606d0c01002))
* removed the collapser between to and cc ([#112](https://github.com/zextras/carbonio-mails-ui/issues/112)) ([a61cc60](https://github.com/zextras/carbonio-mails-ui/commit/a61cc60902c4ae13c7627832b51328da71e44389))


### Bug Fixes

* behaviour of SAVE AS DRAFT, starting editor height ([#132](https://github.com/zextras/carbonio-mails-ui/issues/132)) ([9fb3789](https://github.com/zextras/carbonio-mails-ui/commit/9fb37890556c94cb6539d75dbd76121855b7730d))
* conversation date is now using the date of last message received ([#107](https://github.com/zextras/carbonio-mails-ui/issues/107)) ([b2be8a2](https://github.com/zextras/carbonio-mails-ui/commit/b2be8a26ae1cd410434f82762157e720a98ac632))
* data persist on mails editor ([#126](https://github.com/zextras/carbonio-mails-ui/issues/126)) ([9ff8cca](https://github.com/zextras/carbonio-mails-ui/commit/9ff8cca4657bac81108a7fd95d82717facc0ca79))
* displayer broken issue on sending mail fix ([826bb95](https://github.com/zextras/carbonio-mails-ui/commit/826bb954391bf171a6b6e5219fc1a78825bb241f))
* edit filter issue resolved ([#125](https://github.com/zextras/carbonio-mails-ui/issues/125)) ([4ed61ad](https://github.com/zextras/carbonio-mails-ui/commit/4ed61adbd5e0f5ad056fd0af2bca11a3daa0c0e1))
* fix behavior of loading in search module ([#123](https://github.com/zextras/carbonio-mails-ui/issues/123)) ([1fd33d9](https://github.com/zextras/carbonio-mails-ui/commit/1fd33d98860d845b5e23392bdff13182a191049f))
* fix flashing of sidebar ([#128](https://github.com/zextras/carbonio-mails-ui/issues/128)) ([a848b74](https://github.com/zextras/carbonio-mails-ui/commit/a848b74fbe21f2cd5c7b9446acfc23ecdd500123))
* fixed trash contextual menu ([#120](https://github.com/zextras/carbonio-mails-ui/issues/120)) ([b3c144f](https://github.com/zextras/carbonio-mails-ui/commit/b3c144f34f1573a50f73652f1fb5648cbd1e67b4))
* forward icon not display in forwarded messages ([631fc85](https://github.com/zextras/carbonio-mails-ui/commit/631fc859d2eab95617ae565f6920fcf7d1e101a7))
* hide broken links in folders sidebar ([#133](https://github.com/zextras/carbonio-mails-ui/issues/133)) ([684e726](https://github.com/zextras/carbonio-mails-ui/commit/684e72697b192962a2827668ca46288ed0113970))
* mail notification  and close editor on delete action only for la… ([#106](https://github.com/zextras/carbonio-mails-ui/issues/106)) ([046615b](https://github.com/zextras/carbonio-mails-ui/commit/046615b1ec09d252b1a2161f60e02c78cc4d1eb1))
* reply all addis the signature in editor ([0324103](https://github.com/zextras/carbonio-mails-ui/commit/03241030936ff68e24c1be99579fe13d5113c9b9))
* reply to msg is no longer cropped ([fd857ed](https://github.com/zextras/carbonio-mails-ui/commit/fd857ed453a9cb9b219b176229b9e40d624390c5))
* restore folder confirmation button is disabled until destination folder is selected ([#116](https://github.com/zextras/carbonio-mails-ui/issues/116)) ([a55d8c2](https://github.com/zextras/carbonio-mails-ui/commit/a55d8c271cf6b566b83fdc2d2a592597901f43cd))
* set always sorted by datedesc ([7b0f15b](https://github.com/zextras/carbonio-mails-ui/commit/7b0f15bc3afbb885a1a3869dc59cd7cd75f452bb))
* shared and liked folders, sidebar style ([#103](https://github.com/zextras/carbonio-mails-ui/issues/103)) ([539d447](https://github.com/zextras/carbonio-mails-ui/commit/539d4472079e8e15b8b985b1d71e15ead7704928))
* stop adding RE and FWD if alrady in the msg title ([#131](https://github.com/zextras/carbonio-mails-ui/issues/131)) ([a43425b](https://github.com/zextras/carbonio-mails-ui/commit/a43425b88f7dcabcbf00ae3cf2692c3064a2afff))
* use the folder's translated names ([bb0fd38](https://github.com/zextras/carbonio-mails-ui/commit/bb0fd3874d2560f99a6b261dc8c374360c65ed33))

### [0.1.25](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.24...v0.1.25) (2022-06-20)

### [0.1.24](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.23...v0.1.24) (2022-06-09)


### Features

* managed external images with show/hide ([449379e](https://github.com/zextras/carbonio-mails-ui/commit/449379efe20b68df0166eabd5bf0e26abc68af8d))


### Bug Fixes

* app freeze in longer conversations ([f1b9de8](https://github.com/zextras/carbonio-mails-ui/commit/f1b9de8e91660bc5827dfe143fef177e8c943d35))
* fixed background of lists to allow keyboard navigation ([#94](https://github.com/zextras/carbonio-mails-ui/issues/94)) ([61e314e](https://github.com/zextras/carbonio-mails-ui/commit/61e314e1ff27a11a1f35eac29ef5c46d29f79408))
* fixed teh edit props modal of shared folders ([a8d9570](https://github.com/zextras/carbonio-mails-ui/commit/a8d9570f16902f8f0bf20abb5b9605218d71d994))
* mail preview date sorting does not crash ([a46e8ed](https://github.com/zextras/carbonio-mails-ui/commit/a46e8ed91e780485dd4d5285c1b41cc7f06bbf0e))
* normalization corrected for read flag ([#98](https://github.com/zextras/carbonio-mails-ui/issues/98)) ([9eb19a7](https://github.com/zextras/carbonio-mails-ui/commit/9eb19a70f4f920a66264e7e8e820bf2a202c7b80))
* redirect action does not crash ([7afc0b8](https://github.com/zextras/carbonio-mails-ui/commit/7afc0b8a1bddd791402106b5cc4fc8811c0fe21e))
* white page opening 'find shares' functionality ([48fb37b](https://github.com/zextras/carbonio-mails-ui/commit/48fb37b2568fa5fe855cc533077547a45ff09292))

### [0.1.23](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.22...v0.1.23) (2022-05-25)


### Bug Fixes

* removed show and expand buttons in panel preview header ([4753d2b](https://github.com/zextras/carbonio-mails-ui/commit/4753d2baa980c0e94dadd09afa7cf97274ce484e))

### [0.1.22](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.21...v0.1.22) (2022-05-25)

### [0.1.21](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.20...v0.1.21) (2022-05-24)


### Features

* added folder sharing status icon ([eb087ad](https://github.com/zextras/carbonio-mails-ui/commit/eb087ad233530e84b887273ea63f43eda335b262))

### [0.1.20](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.19...v0.1.20) (2022-05-24)


### Bug Fixes

* fixed conversation sorting ([7a69662](https://github.com/zextras/carbonio-mails-ui/commit/7a696626f5bb447493868228717db92fbcd1aecc))
* old editor opens when new action is clicked ([31bfc16](https://github.com/zextras/carbonio-mails-ui/commit/31bfc16262cc80b6f90f1cbdcdfb3a75e40df5bf))

### [0.1.19](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.18...v0.1.19) (2022-05-20)


### Bug Fixes

* multi accounts lists visualization ([ff5547a](https://github.com/zextras/carbonio-mails-ui/commit/ff5547a5616bf21505dc8777c79fd267c9b73da8))

### [0.1.18](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.17...v0.1.18) (2022-05-12)

### [0.1.17](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.16...v0.1.17) (2022-05-12)


### Features

* add from files integration ([89f0a99](https://github.com/zextras/carbonio-mails-ui/commit/89f0a994f1db69d114cf6159b01c7ca6fb70fe53))
* added onOpen/onClose item handling ([b28a1d4](https://github.com/zextras/carbonio-mails-ui/commit/b28a1d4ce722ee25240f0e0700abe19f275c989b))
* open-prefilled-composer ([a91b716](https://github.com/zextras/carbonio-mails-ui/commit/a91b716e3a360f2c031094f8ccc82f4e32b74483))
* tag search by clicking on tag ([#81](https://github.com/zextras/carbonio-mails-ui/issues/81)) ([83cd3f7](https://github.com/zextras/carbonio-mails-ui/commit/83cd3f7b07709aaae5076833efdf4fdcc3c665cd))
* upload to files integration ([3ff420b](https://github.com/zextras/carbonio-mails-ui/commit/3ff420b0eaac2c255b54bdc66253e3686b5006ce))


### Bug Fixes

* account item overflow ([3a13e7a](https://github.com/zextras/carbonio-mails-ui/commit/3a13e7a5a1e2d33eb561d903c658ab7ce8effa17))
* changed logic behind prefill compose integration ([b56a851](https://github.com/zextras/carbonio-mails-ui/commit/b56a851c5455c23d92ab4112a1bded7f12774f1e))
* editor subject and integrations fixed ([1a962c2](https://github.com/zextras/carbonio-mails-ui/commit/1a962c27c23d03d01c8fc6aa42261e1b9c8ee8a6))
* openIds initial value ([d410c4f](https://github.com/zextras/carbonio-mails-ui/commit/d410c4f7e6ffb56f8eb1323f49018989b1734b38))
* openIds usage ([f606a00](https://github.com/zextras/carbonio-mails-ui/commit/f606a002826d909ae7d3bfd71350578dec61fe51))
* removed applink from account accordion item ([06e8d35](https://github.com/zextras/carbonio-mails-ui/commit/06e8d35fce4c1d01ee73a045fc475bd6e059e613))
* search disable button logic fix ([c2420d6](https://github.com/zextras/carbonio-mails-ui/commit/c2420d6c032149ff6286405eb17b3f515ecfec49))
* shared message for calendar shared ([f93c035](https://github.com/zextras/carbonio-mails-ui/commit/f93c0350b3991dc787eed91d4f973f09a1c22f6f))
* showing tags on search list item using id instead of names ([7aed0ae](https://github.com/zextras/carbonio-mails-ui/commit/7aed0ae741f264f7bb214553757bb6beca6071c8))
* sidebar badge counter ([900d664](https://github.com/zextras/carbonio-mails-ui/commit/900d664406043903a42c068c379ea9de27d8c10d))
* update deps, changed integration id to avoid possible cross module conflicts ([95385a8](https://github.com/zextras/carbonio-mails-ui/commit/95385a8631df63857a341fc10a53feb993ca3566))
* wrong particpant name in some case in mail preview ([3607bcc](https://github.com/zextras/carbonio-mails-ui/commit/3607bccb599ea0b7dcc73612a66fa1b80b48b1f0))

### [0.1.16](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.15...v0.1.16) (2022-04-27)


### Bug Fixes

* preview-ui installation version ([3f09d46](https://github.com/zextras/carbonio-mails-ui/commit/3f09d4697cd2d48c27fdcb8f9f4c02f248e75b53))
* tooltip preview message ([ad407ea](https://github.com/zextras/carbonio-mails-ui/commit/ad407eaeca020808a29e4c8f8271bbed25e5ace6))

### [0.1.15](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.14...v0.1.15) (2022-04-26)


### Features

* tag management in Mails ([2bc2e70](https://github.com/zextras/carbonio-mails-ui/commit/2bc2e70ae69bbb9b4d546b924d89f11507df8d74))


### Bug Fixes

* updated the checked referecne with id instead of names ([#71](https://github.com/zextras/carbonio-mails-ui/issues/71)) ([6f2b911](https://github.com/zextras/carbonio-mails-ui/commit/6f2b91170db5c4309ee1be0879f7d4596c469672))
* uploading attachments issue ([77329f1](https://github.com/zextras/carbonio-mails-ui/commit/77329f1371efc87fc5f85bb10d21cd2e0ed7124f))

### [0.1.14](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.13...v0.1.14) (2022-04-19)


### Bug Fixes

* crash on mail settings view ([0f53d3d](https://github.com/zextras/carbonio-mails-ui/commit/0f53d3d6a945e6d667468c293a62d57fcb4bd0a6))

### [0.1.13](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.11-rc.1...v0.1.13) (2022-04-14)


### Features

* added settings to swap between conversation and message visualization ([3d9d11a](https://github.com/zextras/carbonio-mails-ui/commit/3d9d11a0716d44006d93a4d4b5683e813a7b45e2))


### Bug Fixes

* boken trash action fixed ([47d7985](https://github.com/zextras/carbonio-mails-ui/commit/47d7985cd5a2d44d8e76dc64d8ecfea1c2cc756e))
* changed sync deletion handlers ([96e72f9](https://github.com/zextras/carbonio-mails-ui/commit/96e72f9c9815b64bb542f67c6215dc71a1a25381))
* fixed indentation on en.json ([9ae2071](https://github.com/zextras/carbonio-mails-ui/commit/9ae20712b60f233698c3def1cf39139dd0ad348f))
* folders visible in search filter as per search settings ([#64](https://github.com/zextras/carbonio-mails-ui/issues/64)) ([94d7186](https://github.com/zextras/carbonio-mails-ui/commit/94d7186b28a1d8e58c0f974a377e6e0145c6a251))
* missing actions on mail preview and UI fixes for identity ([55b8292](https://github.com/zextras/carbonio-mails-ui/commit/55b829299e86e195be62a1b8862db6a7064a50d1))
* optional chaining on item avatar ([a63d411](https://github.com/zextras/carbonio-mails-ui/commit/a63d411b790a1c5ce1633128dff38ae9392d7099))
* removed hardcoded labels ([936cd1b](https://github.com/zextras/carbonio-mails-ui/commit/936cd1bde88453044265aa983679c64142c7f37d))
* removed hardcoded labels ([#52](https://github.com/zextras/carbonio-mails-ui/issues/52)) ([50d8853](https://github.com/zextras/carbonio-mails-ui/commit/50d8853d30c4e00f587248dc1a11116ceba7cb40))
* removed hardcoded labels ([#52](https://github.com/zextras/carbonio-mails-ui/issues/52)) ([2bb5d32](https://github.com/zextras/carbonio-mails-ui/commit/2bb5d3249e4dfd8b2ca4ed902dba90c0d26a2dd1))
* replyAll action fixed for sent emails ([ebbbfb2](https://github.com/zextras/carbonio-mails-ui/commit/ebbbfb2d5eddccc0e918e6c396ded25597f0d5b1))
* reset history when moving items away from current folder ([b946d82](https://github.com/zextras/carbonio-mails-ui/commit/b946d824a76ff1b86ca9196048ae007222b6d211))
* some conversations not opening in search result ([82ada6b](https://github.com/zextras/carbonio-mails-ui/commit/82ada6b294a1563274f07ac48fee4a3cdd975050))

### [0.1.11-rc.1](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.11-rc.0...v0.1.11-rc.1) (2022-03-21)


### Bug Fixes

* solved "Cannot read properties of undefined (reading 'split')" crash ([9fc3144](https://github.com/zextras/carbonio-mails-ui/commit/9fc3144ed742b9ace2e357777f513622f7681676))

### [0.1.11-rc.0](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.9-rc.6...v0.1.11-rc.0) (2022-03-18)

### [0.1.9-rc.6](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.9-rc.5...v0.1.9-rc.6) (2022-03-18)


### Features

* added searc request on folder click ([bf54e98](https://github.com/zextras/carbonio-mails-ui/commit/bf54e9837ad192d6102372aeda2ee70df341e0b5))
* conversation sort order implemented ([786c3d8](https://github.com/zextras/carbonio-mails-ui/commit/786c3d85393515e36a9dd991062224ef60effa9c))
* print message feature ([9761a54](https://github.com/zextras/carbonio-mails-ui/commit/9761a543f8c9936b6e2a8261ba8496b5fc3b0fd9))
* settings enhancement ([73c69d5](https://github.com/zextras/carbonio-mails-ui/commit/73c69d551c0f88b6aaccec6383cdffa75b28116d))
* show quoted text functionality added ([30dcbb9](https://github.com/zextras/carbonio-mails-ui/commit/30dcbb9fd5c2fea364978460c21b39c7733e577e))


### Bug Fixes

* added missing tooltip on mail folders ([04b06ab](https://github.com/zextras/carbonio-mails-ui/commit/04b06abc362dee453420d83712ec64bdb1a9c810))
* broken search fixed ([9881852](https://github.com/zextras/carbonio-mails-ui/commit/9881852409bf5b4435897bd16f2b5cf70a27a1f4))
* clean code ([66df553](https://github.com/zextras/carbonio-mails-ui/commit/66df553160cf55c1c9107265375d31cba279568c))
* drafts diplayer is showing spam's banner ([0c07723](https://github.com/zextras/carbonio-mails-ui/commit/0c07723657c34892ed6c0f568f1d39cda5311a97))
* fixed data normalization in conversation ([1cedd98](https://github.com/zextras/carbonio-mails-ui/commit/1cedd986250f67dd913d0ae771d97e57efa96ba9))
* implemented review feedback ([4e57d95](https://github.com/zextras/carbonio-mails-ui/commit/4e57d951d107830300aeb8fa89390eece9391975))
* major fixes around lists and request ([12c196a](https://github.com/zextras/carbonio-mails-ui/commit/12c196ac40b3b164dc1c60bc5a339fffc91bd44a))
* message list view ([17c41e3](https://github.com/zextras/carbonio-mails-ui/commit/17c41e3f267faa8bb978cfb53dfa5d93c7c587a4))
* minor fixes around the project ([fd6ecc9](https://github.com/zextras/carbonio-mails-ui/commit/fd6ecc9e8b4e372d2fcf33c64da0707433966080))
* missing attachments from external domain ([e739a03](https://github.com/zextras/carbonio-mails-ui/commit/e739a03ab41fb984270d914b71c740de869fe400))
* reply to messages does not make the message disappear from list ([efe4cb5](https://github.com/zextras/carbonio-mails-ui/commit/efe4cb53a420bf7208f36d80960295e56bd60e04))
* shared folder changing retention values ([3ba1ed9](https://github.com/zextras/carbonio-mails-ui/commit/3ba1ed9d1a1ea0d015ea81f96993aaa45cf9b3ef))
* wipe folder action is not disabled by default inside spam ([d2fb95b](https://github.com/zextras/carbonio-mails-ui/commit/d2fb95be934db44370585d100d6c01f3f76335f5))

### [0.1.9-rc.5](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.9-rc.4...v0.1.9-rc.5) (2022-02-24)


### Features

* applied shell breaking changes ([f72ab4c](https://github.com/zextras/carbonio-mails-ui/commit/f72ab4c284a2ff5452a3c5cc79deaf7e61a0506e))
* message action on conversations with single messages only ([0f692e2](https://github.com/zextras/carbonio-mails-ui/commit/0f692e22b06823cd4de086f11f297951b4bdf587))


### Bug Fixes

* broken new mail action fixed ([13e3add](https://github.com/zextras/carbonio-mails-ui/commit/13e3addab9284f2e4e70376cf4284b999386e08a))
* redirect of e-mail is not working issue ([58293f0](https://github.com/zextras/carbonio-mails-ui/commit/58293f041376af7afe64ea6daf13cfb77aadf850))
* select a conversation on search result that contains draft ([415f857](https://github.com/zextras/carbonio-mails-ui/commit/415f857b1c7bb401408c85a79a7deded8b58291e))

### [0.1.9-rc.4](https://github.com/zextras/carbonio-mails-ui/compare/v0.1.9-rc.3...v0.1.9-rc.4) (2022-02-10)


### Features

* message displayer actions fill available view, the remaining ones will be inside dropdown ([5964e27](https://github.com/zextras/carbonio-mails-ui/commit/5964e271b99b482e51df3abcc63a0c2ec8a981d4))


### Bug Fixes

* add signatures on editor composer ([88bcff3](https://github.com/zextras/carbonio-mails-ui/commit/88bcff35a3e618487bb984c4c24568c6ca6674fb))
* correct mp values for attach after saveDraft request is fullfiled ([90c6d26](https://github.com/zextras/carbonio-mails-ui/commit/90c6d26c15c90dc82a57621e146faf4dde1c3c81))
* improved performance of updateFolders ([9329812](https://github.com/zextras/carbonio-mails-ui/commit/932981216b54ce9b9e29cd85b3c01c83a0cca520))
* module breaking on attachement with no name or extenstion ([e75cd39](https://github.com/zextras/carbonio-mails-ui/commit/e75cd39b8cf8eff1a5b563ee1defc916a7cd3ae9))
* replaced lodash reduce function with vanilla js ([9da54b1](https://github.com/zextras/carbonio-mails-ui/commit/9da54b173f8d847495fc88bc277855dc737319fa))
* restoring filter parent folder in new folder modal ([f55c558](https://github.com/zextras/carbonio-mails-ui/commit/f55c5581eac56401d4555fab313a936fd2e42c68))
* solved the loops that caused long page freezes ([d2cdcd3](https://github.com/zextras/carbonio-mails-ui/commit/d2cdcd367daafcf65ac0f0947fe77e3c4b2f6e7e))
* two icons display in reply case ([921fe83](https://github.com/zextras/carbonio-mails-ui/commit/921fe83fb728e39c5e1b6720994cc3a56f712145))
* using useUserAccount in signature-settings ([a4e9ac0](https://github.com/zextras/carbonio-mails-ui/commit/a4e9ac0773aa93e4305893c1b029736699c5d83b))

### 0.1.9-rc.3 (2022-01-21)


### Features

* email auto save to draft also if contact or subject changed ([b6cfff9](https://github.com/zextras/carbonio-mails-ui/commit/b6cfff9b672fa2a0d42109b3d4cc726fc7d77830))
* first commit ([8be53e7](https://github.com/zextras/carbonio-mails-ui/commit/8be53e7979834682321cf986faef73de31fde5fc))


### Bug Fixes

* capital variable updated ([c164a0f](https://github.com/zextras/carbonio-mails-ui/commit/c164a0faffd671627a85db42eae911cd54078b0d))
* changed text area composer min height ([d753413](https://github.com/zextras/carbonio-mails-ui/commit/d75341346aa54e98a9034da6ad356ec4775dd0e1))
* deleted double licence block in edit-view ([ede1ad4](https://github.com/zextras/carbonio-mails-ui/commit/ede1ad4805ac9b2228c3ea78100858d3c44cb165))
* draft deleted after sending ([8d8de9b](https://github.com/zextras/carbonio-mails-ui/commit/8d8de9bad9aac4726f5bdfb502cfb1c69e53f56e))
* editor background fill entire height ([561c551](https://github.com/zextras/carbonio-mails-ui/commit/561c5516da6a877df7f072bd53de8d14d0eaefa4))
* selection mode for email not select email ([a2b9cd7](https://github.com/zextras/carbonio-mails-ui/commit/a2b9cd725b74004a276501777c773fe68197d6c6))
* signature dropdown is not updated on add signature ([ec5f828](https://github.com/zextras/carbonio-mails-ui/commit/ec5f8284ca43c4a5c8f5aac3d98fb7ef7204449a))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.
