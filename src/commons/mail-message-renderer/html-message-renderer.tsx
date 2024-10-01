/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Container, IconButton, MultiButton, Row } from '@zextras/carbonio-design-system';
import { editSettings, t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, forEach, isArray, reduce, some } from 'lodash';
import { Trans } from 'react-i18next';
import styled from 'styled-components';

import { WarningBanner } from './warning-banner';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { getAttachmentParts } from '../../helpers/attachments';
import { getNoIdentityPlaceholder } from '../../helpers/identities';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getMsg } from '../../store/actions';
import { selectMessage } from '../../store/messages-slice';
import { retrieveFullMessage } from '../../store/zustand/search/hooks/hooks';
import { useMessageById } from '../../store/zustand/search/store';
import { MailsStateType } from '../../types';
import { useInSearchModule } from '../../ui-actions/utils';
import { getOriginalHtmlContent, getQuotedTextFromOriginalContent } from '../get-quoted-text-util';
import { _CI_REGEX, _CI_SRC_REGEX, isAvailableInTrusteeList } from '../utils';

const StyledMultiBtn = styled(MultiButton)`
	border: 0.0625rem solid ${(props): string => props.theme.palette.warning.regular};
	height: 2rem;
	& > * {
		background-color: ${(props): string => props.theme.palette.transparent.regular} !important;
		cursor: pointer;
	}
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.focus};
	}
	svg {
		padding: 0 !important;
	}
`;

type HtmlMessageRendererType = {
	msgId: string;
};

export const HtmlMessageRenderer: FC<HtmlMessageRendererType> = ({ msgId }) => {
	const messageFromReduxStore = useAppSelector((state: MailsStateType) =>
		selectMessage(state, msgId)
	);
	const messageFromSearchStore = useMessageById(msgId);
	const message = messageFromReduxStore || messageFromSearchStore;
	const { body, parts: originalParts, participants } = message;

	const parts = useMemo(
		() => (originalParts ? getAttachmentParts(originalParts) : []),
		[originalParts]
	);

	const divRef = useRef<HTMLDivElement>(null);
	const [showQuotedText, setShowQuotedText] = useState(false);
	const isInSearchModule = useInSearchModule();
	const dispatch = useAppDispatch();

	const settingsPref = useUserSettings()?.prefs;
	const from =
		filter(participants, { type: ParticipantRole.FROM })[0]?.address ?? getNoIdentityPlaceholder();
	const domain = from?.substring(from.lastIndexOf('@') + 1);
	const [showExternalImage, setShowExternalImage] = useState(false);
	const [displayBanner, setDisplayBanner] = useState(true);
	const originalContent = getOriginalHtmlContent(body.content);
	const quoted = getQuotedTextFromOriginalContent(body.content, originalContent);

	const contentToDisplay = useMemo(
		() => (showQuotedText ? body.content : originalContent),
		[showQuotedText, body.content, originalContent]
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
		(trustee) => {
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

	const externalImagesMultiButtonLabel = useMemo(() => t('label.view_images', 'VIEW IMAGES'), []);
	const externalImageWarningLabel = useMemo(
		() =>
			t(
				'message.external_images_blocked',
				'External images have been blocked to protect you against potential spam'
			),
		[]
	);
	const truncatedWarningButtonLabel = useMemo(
		() => t('warningBanner.truncatedMessage.button', 'LOAD MESSAGE'),
		[]
	);
	const truncatedWarningLabel = useMemo(
		() =>
			t('warningBanner.truncatedMessage.label', 'The message is too large and has been cropped'),
		[]
	);
	const loadMessage = async (): Promise<void> => {
		if (isInSearchModule) {
			retrieveFullMessage(msgId);
			return;
		}
		dispatch(getMsg({ msgId }));
	};
	return (
		<div ref={divRef} className="force-white-bg" style={{ height: '100%' }}>
			{showBanner && !showExternalImage && (
				<WarningBanner warningLabel={externalImageWarningLabel}>
					<Row
						height="fit"
						orientation="vertical"
						display="flex"
						wrap="nowrap"
						mainAlignment="flex-end"
						padding={{ left: 'small' }}
						style={{
							flexGrow: 1,
							flexDirection: 'row'
						}}
					>
						<StyledMultiBtn
							background="transparent"
							type="outlined"
							label={externalImagesMultiButtonLabel}
							color="warning"
							onClick={(): void => {
								setShowExternalImage(true);
							}}
							dropdownProps={{
								maxWidth: '31.25rem',
								width: 'fit',
								items
							}}
							items={items}
						/>
						<IconButton
							icon="CloseOutline"
							onClick={(): void => setDisplayBanner(false)}
							customSize={{
								iconSize: 'large',
								paddingSize: 'small'
							}}
							size="small"
						/>
					</Row>
				</WarningBanner>
			)}
			{body.truncated && (
				<WarningBanner warningLabel={truncatedWarningLabel}>
					<Button
						backgroundColor="transparent"
						type="outlined"
						label={truncatedWarningButtonLabel}
						color="warning"
						onClick={loadMessage}
					/>
				</WarningBanner>
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
