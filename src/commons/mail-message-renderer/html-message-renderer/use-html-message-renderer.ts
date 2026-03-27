/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { updateSettings, useUserSettings } from '@zextras/carbonio-shell-ui';
import { JSNS, ParticipantRole } from '@zextras/carbonio-ui-commons';
import { AccountSettingsPrefs, soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';
import { filter, forEach, isArray, some } from 'lodash';

import { getFlattenedAttachmentParts } from '../../../helpers/attachments';
import { getNoIdentityPlaceholder } from '../../../helpers/identities';
import { getFullMessageEmailStoreAction } from '../../../store/emails/actions/get-message';
import {
	getOriginalHtmlContent,
	getQuotedTextFromOriginalContent
} from '../../get-quoted-text-util';
import {
	buildImageMap,
	decodeSurrogatePairs,
	isAvailableInTrusteeList,
	updateImageSrc
} from '../../utils';
import { BodyPart, MailMessage, MailMessagePartWithDisposition } from 'types/messages';

export type ExternalImageState = {
	showExternalImages: boolean;
	displayBanner: boolean;
	hasExternalImages: boolean;
};

export type MessageContent = {
	cleanBodyContent: string;
	originalContent: string;
	quotedText: string;
	contentToDisplay: string;
};

export type SettingsPrefs = {
	zimbraPrefMailTrustedSenderList?: string | string[];
};

export type TrustMenuItem = {
	id: string;
	label: string;
	onClick: () => void;
};

export type HtmlMessageRendererState = {
	// Content state
	messageContent: MessageContent;
	processedContent: string;

	// External images state
	externalImageState: ExternalImageState & {
		setShowExternalImages: (show: boolean) => void;
		setDisplayBanner: (display: boolean) => void;
		saveTrustee: (trustee: string) => void;
	};

	// UI state
	isLoadingMessage: boolean;
	showQuotedText: boolean;

	// Derived data
	fromAddress: string;
	fromDomain: string;
	trustMenuItems: TrustMenuItem[];

	// Actions
	loadFullMessage: () => Promise<void>;
	handleShowQuotedText: () => void;
};

// Custom hook for managing external images
const useExternalImages = (
	from: string,
	settingsPrefs: SettingsPrefs,
	hasExternalImages: boolean
): ExternalImageState & {
	setShowExternalImages: (show: boolean) => void;
	setDisplayBanner: (display: boolean) => void;
	saveTrustee: (trustee: string) => void;
} => {
	const [showExternalImages, setShowExternalImages] = useState(false);
	const [displayBanner, setDisplayBanner] = useState(true);

	useEffect(() => {
		if (isAvailableInTrusteeList(settingsPrefs.zimbraPrefMailTrustedSenderList ?? '', from)) {
			setShowExternalImages(true);
		}
	}, [from, settingsPrefs.zimbraPrefMailTrustedSenderList]);

	const saveTrustee = useCallback(
		(trustee: string) => {
			let trusteeAddresses: string[] = [];

			if (settingsPrefs.zimbraPrefMailTrustedSenderList) {
				trusteeAddresses = isArray(settingsPrefs.zimbraPrefMailTrustedSenderList)
					? settingsPrefs.zimbraPrefMailTrustedSenderList
					: settingsPrefs.zimbraPrefMailTrustedSenderList.split(',');
			}

			const zimbraPrefMailTrustedSenderList = [...trusteeAddresses, trustee];

			soapFetchV2<
				{ _attrs: AccountSettingsPrefs; _jsns: JSNS },
				{ ModifyPrefsResponse: Record<string, unknown> }
			>('ModifyPrefs', {
				_jsns: JSNS.ACCOUNT,
				_attrs: { zimbraPrefMailTrustedSenderList }
			}).then((rawSoapResponse) => {
				if (!('Fault' in rawSoapResponse.Body)) {
					updateSettings({ prefs: { zimbraPrefMailTrustedSenderList } });
					setShowExternalImages(true);
				}
			});
		},
		[settingsPrefs.zimbraPrefMailTrustedSenderList]
	);

	const shouldShowBanner = useMemo(
		() =>
			hasExternalImages &&
			!isAvailableInTrusteeList(settingsPrefs.zimbraPrefMailTrustedSenderList ?? '', from) &&
			displayBanner,
		[from, hasExternalImages, settingsPrefs.zimbraPrefMailTrustedSenderList, displayBanner]
	);

	return {
		showExternalImages,
		displayBanner,
		hasExternalImages: shouldShowBanner,
		setShowExternalImages,
		setDisplayBanner,
		saveTrustee
	};
};

// Custom hook for processing message content
const useMessageContent = (body: BodyPart, showQuotedText: boolean): MessageContent => {
	const bodyContent = body.content;

	// Remove extra color properties that are added by the rich text editor
	const cleanBodyContent = useMemo(
		() => bodyContent.replace(/color:\s*#000000;?/i, ''),
		[bodyContent]
	);

	const originalContent = useMemo(
		() => getOriginalHtmlContent(cleanBodyContent),
		[cleanBodyContent]
	);

	const quotedText = useMemo(
		() => getQuotedTextFromOriginalContent(cleanBodyContent, originalContent),
		[cleanBodyContent, originalContent]
	);

	const contentToDisplay = useMemo(
		() => (showQuotedText ? cleanBodyContent : originalContent),
		[cleanBodyContent, originalContent, showQuotedText]
	);

	return {
		cleanBodyContent,
		originalContent,
		quotedText,
		contentToDisplay
	};
};

// Custom hook for processing HTML content
const useProcessedContent = (
	contentToDisplay: string,
	attachments: MailMessagePartWithDisposition[],
	showExternalImages: boolean,
	messageId: string
): { processedContent: string; hasExternalImages: boolean } => {
	const { processedContent, hasExternalImages } = useMemo(() => {
		const parser = new DOMParser();
		const htmlDoc = parser.parseFromString(contentToDisplay, 'text/html');
		const images = htmlDoc.body.getElementsByTagName('img');

		const hasExtImages = some(images, (img) => img.hasAttribute('dfsrc'));

		// Process images
		const imageMap = buildImageMap(attachments);
		forEach(images, (img) => {
			updateImageSrc(img, imageMap, showExternalImages, messageId);
		});

		return {
			processedContent: decodeSurrogatePairs(htmlDoc.documentElement.outerHTML),
			hasExternalImages: hasExtImages
		};
	}, [contentToDisplay, attachments, showExternalImages, messageId]);

	return { processedContent, hasExternalImages };
};

/**
 * HTML message renderer hook
 */
export const useHtmlMessageRenderer = (message: MailMessage): HtmlMessageRendererState => {
	const [isLoadingMessage, setIsLoadingMessage] = useState(false);
	const [showQuotedText, setShowQuotedText] = useState(false);

	// Extract message data
	const body: BodyPart = message?.body ?? { content: '', truncated: false };
	const attachments = useMemo(() => getFlattenedAttachmentParts(message), [message]);

	// Get sender information
	const settingsPrefs = useUserSettings()?.prefs as SettingsPrefs;
	const fromParticipant = useMemo(
		() => filter(message?.participants ?? [], { type: ParticipantRole.FROM })[0],
		[message?.participants]
	);
	const fromAddress = fromParticipant?.address ?? getNoIdentityPlaceholder();
	const fromDomain = fromAddress?.substring(fromAddress.lastIndexOf('@') + 1);

	// Process message content
	const messageContent = useMessageContent(body, showQuotedText);

	// Process HTML and handle external images
	const { hasExternalImages } = useProcessedContent(
		messageContent.contentToDisplay,
		attachments,
		false,
		message.id
	);

	const externalImageState = useExternalImages(fromAddress, settingsPrefs, hasExternalImages);

	// Reprocess content when external image state changes
	const { processedContent: finalProcessedContent } = useProcessedContent(
		messageContent.contentToDisplay,
		attachments,
		externalImageState.showExternalImages,
		message.id
	);

	// Trust menu items
	const trustMenuItems = useMemo<TrustMenuItem[]>(
		() => [
			{
				id: 'always-allow-address',
				label: `Always allow from ${fromAddress}`,
				onClick: () => externalImageState.saveTrustee(fromAddress)
			},
			{
				id: 'always-allow-domain',
				label: `Always allow from ${fromDomain} domain`,
				onClick: () => externalImageState.saveTrustee(fromDomain)
			}
		],
		[fromAddress, fromDomain, externalImageState]
	);

	const loadFullMessage = useCallback(async (): Promise<void> => {
		setIsLoadingMessage(true);
		try {
			await getFullMessageEmailStoreAction(message.id, true);
		} finally {
			setIsLoadingMessage(false);
		}
	}, [message.id]);

	const handleShowQuotedText = useCallback(() => {
		setShowQuotedText(true);
	}, []);

	return {
		messageContent,
		processedContent: finalProcessedContent,
		externalImageState,
		isLoadingMessage,
		showQuotedText,
		fromAddress,
		fromDomain,
		trustMenuItems,
		loadFullMessage,
		handleShowQuotedText
	};
};
