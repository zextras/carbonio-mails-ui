/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Container, Row } from '@zextras/carbonio-design-system';
import { editSettings, t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, forEach, isArray, reduce, some } from 'lodash';
import { Trans } from 'react-i18next';

import { BannerMessageTruncated } from './banner-message-truncated';
import { BannerViewExternalImages } from './banner-view-external-images';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { getAttachmentParts } from '../../helpers/attachments';
import { getNoIdentityPlaceholder } from '../../helpers/identities';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getFullMsgAsyncThunk } from '../../store/actions';
import { selectMessage } from '../../store/messages-slice';
import { retrieveFullMessage } from '../../store/zustand/search/hooks/hooks';
import { useMessageById } from '../../store/zustand/search/store';
import { BodyPart, MailsStateType } from '../../types';
import { useInSearchModule } from '../../ui-actions/utils';
import { getOriginalHtmlContent, getQuotedTextFromOriginalContent } from '../get-quoted-text-util';
import { _CI_REGEX, _CI_SRC_REGEX, isAvailableInTrusteeList } from '../utils';

type HtmlMessageRendererType = {
	msgId: string;
};

export const HtmlMessageRenderer: FC<HtmlMessageRendererType> = ({ msgId }) => {
	const [isLoadingMessage, setIsLoadingMessage] = useState(false);
	const isInSearchModule = useInSearchModule();
	const messageFromReduxStore = useAppSelector((state: MailsStateType) =>
		selectMessage(state, msgId)
	);
	const messageFromSearchStore = useMessageById(msgId);
	const message = isInSearchModule ? messageFromSearchStore : messageFromReduxStore;
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

	const dispatch = useAppDispatch();

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

	const contentWithImages = useMemo(() => {
		const imgMap = reduce(
			parts,
			(r, v) => {
				if (!_CI_REGEX.test(v.ci ?? '')) return r;
				r[_CI_REGEX.exec(v.ci ?? '')?.[1] ?? ''] = v;
				return r;
			},
			{} as any
		);
		forEach(images, (p: HTMLImageElement) => {
			if (p.hasAttribute('dfsrc') && showImage) {
				p.setAttribute('src', p.getAttribute('dfsrc') ?? '');
			}
			if (!_CI_SRC_REGEX.test(p.src)) return;
			const ci = _CI_SRC_REGEX.exec(p.getAttribute('src') ?? '')?.[1] ?? '';
			if (imgMap[ci]) {
				const part = imgMap[ci];
				p.setAttribute('pnsrc', p.getAttribute('src') ?? '');
				p.setAttribute('src', `/service/home/~/?auth=co&id=${msgId}&part=${part.name}`);
			}
		});
		return htmlDoc.body.innerHTML;
	}, [htmlDoc.body.innerHTML, images, msgId, parts, showImage]);

	const loadMessage = async (): Promise<void> => {
		setIsLoadingMessage(true);
		if (isInSearchModule) {
			retrieveFullMessage(msgId).finally(() => setIsLoadingMessage(false));
			return;
		}
		dispatch(getFullMsgAsyncThunk({ msgId })).finally(() => setIsLoadingMessage(false));
	};

	return (
		<div ref={divRef} className="force-white-bg" style={{ height: '100%' }}>
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
			<Container
				width={'fit'}
				height={'100%'}
				data-testid="message-renderer-container"
				style={{ overflowY: 'auto', overflowX: 'hidden' }}
				dangerouslySetInnerHTML={{
					__html: contentWithImages
				}}
			/>
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
