/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Container, Row } from '@zextras/carbonio-design-system';
import { editSettings, t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, forEach, isArray, some } from 'lodash';
import { Trans } from 'react-i18next';

import { BannerMessageTruncated } from './banner-message-truncated';
import { BannerViewExternalImages } from './banner-view-external-images';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { getAttachmentParts } from '../../helpers/attachments';
import { getNoIdentityPlaceholder } from '../../helpers/identities';
import { BodyPart, MailMessage } from '../../types';
import { getOriginalHtmlContent, getQuotedTextFromOriginalContent } from '../get-quoted-text-util';
import {
	buildImageMap,
	decodeSurrogatePairs,
	isAvailableInTrusteeList,
	updateImageSrc
} from '../utils';
import { ShadowDomWrapper } from './shadow-dom-wrapper';
import { getFullMessageEmailStoreAction } from '../../store/emails/actions/get-message';

type HtmlMessageRendererType = {
	message: MailMessage;
};

export const HtmlMessageRenderer = ({ message }: HtmlMessageRendererType): React.JSX.Element => {
	const [isLoadingMessage, setIsLoadingMessage] = useState(false);
	const body: BodyPart = message?.body ?? {
		content: '',
		truncated: false
	};
	const bodyContent = body.content;
	const participants = message?.participants ?? [];

	const parts = useMemo(() => {
		const originalParts = message?.parts ?? [];
		return originalParts ? getAttachmentParts(originalParts) : [];
	}, [message]);

	const divRef = useRef<HTMLDivElement>(null);
	const [showQuotedText, setShowQuotedText] = useState(false);

	const settingsPref = useUserSettings()?.prefs;
	const from =
		filter(participants, { type: ParticipantRole.FROM })[0]?.address ?? getNoIdentityPlaceholder();
	const domain = from?.substring(from.lastIndexOf('@') + 1);
	const [showExternalImage, setShowExternalImage] = useState(false);
	const [displayBanner, setDisplayBanner] = useState(true);
	const originalContent = getOriginalHtmlContent(bodyContent);
	const quoted = getQuotedTextFromOriginalContent(bodyContent, originalContent);

	const contentToDisplay = useMemo(
		() => (showQuotedText ? bodyContent : originalContent),
		[showQuotedText, bodyContent, originalContent]
	);

	const parser = new DOMParser();
	const htmlDoc = parser.parseFromString(contentToDisplay, 'text/html');
	const images = htmlDoc.body.getElementsByTagName('img');

	const hasExternalImages = useMemo(() => some(images, (i) => i.hasAttribute('dfsrc')), [images]);

	const showBanner = useMemo(
		() =>
			hasExternalImages &&
			!isAvailableInTrusteeList(settingsPref.zimbraPrefMailTrustedSenderList ?? '', from) &&
			displayBanner,
		[from, hasExternalImages, settingsPref.zimbraPrefMailTrustedSenderList, displayBanner]
	);
	useEffect(() => {
		if (isAvailableInTrusteeList(settingsPref.zimbraPrefMailTrustedSenderList ?? '', from))
			setShowExternalImage(true);
	}, [from, settingsPref.zimbraPrefMailTrustedSenderList]);

	const saveTrustee = useCallback(
		(trustee: string) => {
			let trusteeAddress: string[] = [];
			if (settingsPref.zimbraPrefMailTrustedSenderList) {
				trusteeAddress = isArray(settingsPref.zimbraPrefMailTrustedSenderList)
					? settingsPref.zimbraPrefMailTrustedSenderList
					: // eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						settingsPref.zimbraPrefMailTrustedSenderList?.split(',');
			}

			editSettings({
				prefs: { zimbraPrefMailTrustedSenderList: [...trusteeAddress, trustee] }
			}).then((res) => {
				if (res.type?.includes('fulfilled')) {
					setShowExternalImage(true);
				}
			});
		},
		[settingsPref.zimbraPrefMailTrustedSenderList]
	);

	const items = useMemo<any[]>(
		() => [
			{
				id: 'always-allow-address',
				label: (
					<Trans
						i18nKey="label.always_allow_address"
						defaults="Always allow from <strong>{{values}}</strong>"
						values={{ from }}
					/>
				),
				onClick: () => saveTrustee(from)
			},
			{
				id: 'always-allow-domain',
				label: (
					<Trans
						i18nKey="label.always_allow_domain"
						defaults="Always allow from <strong>{{values}}</strong> domain"
						values={{ domain }}
					/>
				),
				onClick: () => saveTrustee(domain)
			}
		],
		[from, domain, saveTrustee]
	);

	const showImage = useMemo(
		() => showExternalImage && displayBanner,
		[displayBanner, showExternalImage]
	);
	const msgId = message.id;

	const processedContent = useMemo(() => {
		// Handle images
		const imgMap = buildImageMap(parts);
		forEach(images, (img) => {
			updateImageSrc(img, imgMap, showImage, msgId);
		});
		const html = htmlDoc.documentElement.outerHTML;

		// Decode surrogate pairs (broken emojis handling)
		return decodeSurrogatePairs(html);
	}, [htmlDoc.documentElement.outerHTML, images, msgId, parts, showImage]);

	const loadMessage = async (): Promise<void> => {
		setIsLoadingMessage(true);
		getFullMessageEmailStoreAction(msgId).finally(() => {
			setIsLoadingMessage(false);
		});
	};

	return (
		<div ref={divRef} style={{ height: '100%' }}>
			{showBanner && !showExternalImage && (
				<BannerViewExternalImages
					setShowExternalImages={setShowExternalImage}
					setDisplayBanner={setDisplayBanner}
					items={items}
				/>
			)}
			{body.truncated && (
				<BannerMessageTruncated loadMessage={loadMessage} isLoadingMessage={isLoadingMessage} />
			)}
			<ShadowDomWrapper>
				<Container
					width={'fit'}
					height={'100%'}
					data-testid="message-renderer-container"
					style={{ overflowY: 'auto', padding: '0.75rem 0px' }}
					dangerouslySetInnerHTML={{
						__html: processedContent
					}}
				/>
			</ShadowDomWrapper>
			{!showQuotedText && quoted.length > 0 && (
				<Row mainAlignment="center" crossAlignment="center">
					<Button
						label={t('label.show_quoted_text', 'Show quoted text')}
						icon="EyeOutline"
						type="outlined"
						onClick={(): void => setShowQuotedText(true)}
						width="fill"
					/>
				</Row>
			)}
		</div>
	);
};
