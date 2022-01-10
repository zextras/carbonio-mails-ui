/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

export const useDisabled = ({
	sizeSmaller,
	sizeLarger,
	totalKeywords,
	subject,
	unreadFilter,
	attachmentFilter,
	flaggedFilter,
	receivedFromAddress,
	sentFromAddress,
	emailStatus,
	folder,
	sentBefore,
	sentOn,
	sentAfter,
	tag,
	attachmentType
}) =>
	useMemo(
		() =>
			(totalKeywords === 0 &&
				subject.length === 0 &&
				unreadFilter.length === 0 &&
				attachmentFilter.length === 0 &&
				flaggedFilter.length === 0 &&
				attachmentType.length === 0 &&
				emailStatus.length === 0 &&
				sizeSmaller.length === 0 &&
				sizeLarger.length === 0 &&
				receivedFromAddress.length === 0 &&
				sentFromAddress.length === 0 &&
				emailStatus.length === 0 &&
				sizeSmaller.length === 0 &&
				sizeLarger.length === 0 &&
				folder.length === 0 &&
				sentBefore.length === 0 &&
				sentOn.length === 0 &&
				sentAfter.length === 0 &&
				tag.length === 0 &&
				attachmentType.length === 0) ||
			(receivedFromAddress && receivedFromAddress[0]?.hasError === true) ||
			(sentFromAddress && sentFromAddress[0]?.hasError === true) ||
			(sizeSmaller && sizeSmaller[0]?.error === true) ||
			(sizeLarger && sizeLarger[0]?.error === true),
		[
			sizeSmaller,
			sizeLarger,
			totalKeywords,
			subject.length,
			unreadFilter.length,
			attachmentFilter.length,
			flaggedFilter.length,
			receivedFromAddress,
			sentFromAddress,
			emailStatus.length,
			folder.length,
			sentBefore.length,
			sentOn.length,
			sentAfter.length,
			tag.length,
			attachmentType.length
		]
	);

export const useSecondaryDisabled = ({
	attachmentFilter,
	attachmentType,
	emailStatus,
	flaggedFilter,
	folder,
	receivedFromAddress,
	sentAfter,
	sentBefore,
	sentFromAddress,
	sentOn,
	sizeLarger,
	sizeSmaller,
	subject,
	tag,
	totalKeywords,
	unreadFilter
}) =>
	useMemo(
		() =>
			totalKeywords === 0 &&
			subject.length === 0 &&
			attachmentType.length === 0 &&
			emailStatus.length === 0 &&
			sizeSmaller.length === 0 &&
			sizeLarger.length === 0 &&
			unreadFilter.length === 0 &&
			attachmentFilter.length === 0 &&
			flaggedFilter.length === 0 &&
			receivedFromAddress.length === 0 &&
			sentFromAddress.length === 0 &&
			folder.length === 0 &&
			sentBefore.length === 0 &&
			sentOn.length === 0 &&
			sentAfter.length === 0 &&
			tag.length === 0,
		[
			attachmentFilter.length,
			attachmentType.length,
			emailStatus.length,
			flaggedFilter.length,
			folder.length,
			receivedFromAddress.length,
			sentAfter.length,
			sentBefore.length,
			sentFromAddress.length,
			sentOn.length,
			sizeLarger.length,
			sizeSmaller.length,
			subject.length,
			tag.length,
			totalKeywords,
			unreadFilter.length
		]
	);
