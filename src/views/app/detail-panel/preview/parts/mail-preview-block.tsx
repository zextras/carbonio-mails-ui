/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import {
	Button,
	Container,
	Divider,
	Icon,
	Padding,
	Row,
	Text
} from '@zextras/carbonio-design-system';
import { FOLDERS, getFolderIdParts } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { useMsgSetNotSpamFn } from 'hooks/actions/use-msg-set-not-spam';
import { MailMessage } from 'types/index.d';
import { type DetailPanelRouteParams } from 'views/app/detail-panel';
import PreviewHeader from 'views/app/detail-panel/preview/parts/preview-header';

type MailPreviewBlockType = {
	message: MailMessage;
	open: boolean;
	onClick: () => void;
	isEml?: boolean;
};
export const MailPreviewBlock: FC<MailPreviewBlockType> = ({
	message,
	open,
	onClick,
	isEml = false
}) => {
	const { itemId, folderId } = useParams<DetailPanelRouteParams>() as DetailPanelRouteParams;
	const compProps = useMemo(
		() => ({ message, onClick, open, isEml }),
		[message, onClick, open, isEml]
	);
	const shouldReplaceHistory = useMemo(() => itemId === message.id, [message.id, itemId]);
	const [t] = useTranslation();

	const { execute } = useMsgSetNotSpamFn({
		ids: [message.id],
		folderId,
		shouldReplaceHistory
	});
	return (
		<>
			{folderId && getFolderIdParts(folderId).id === FOLDERS.SPAM && (
				<Container
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					height="fit"
					padding={{ bottom: 'medium' }}
				>
					<Container background="gray6" orientation="horizontal" padding={{ all: 'small' }}>
						<Row width="50%" display="flex" crossAlignment="center" mainAlignment="flex-start">
							<Padding right="small">
								<Icon icon="AlertCircleOutline" size="medium" />
							</Padding>
							<Text>
								{t('messages.snackbar.marked_as_spam', 'You’ve marked this e-mail as Spam')}
							</Text>
						</Row>
						<Row width="50%" mainAlignment="flex-end">
							<Button
								type="ghost"
								label={t('action.mark_as_non_spam', 'Not Spam')}
								color="primary"
								onClick={execute}
							/>
						</Row>
					</Container>
				</Container>
			)}
			{message && (
				<Row width="fill">
					<PreviewHeader compProps={compProps} />
				</Row>
			)}

			{/* External message disclaimer */}
			{isEml && (
				<Container height="fit" background="white" padding={{ top: 'large', bottom: 'large' }}>
					<Row
						background="gray2"
						width="fill"
						padding={{ all: 'large' }}
						mainAlignment="flex-start"
					>
						<Padding right="large">
							<Icon icon="AlertCircleOutline" size="large" />
						</Padding>
						<Text>
							{t(
								'label.attachments_disclaimer',
								'You are viewing an attached message. The authenticity of the attached messages can not be verified.'
							)}
						</Text>
					</Row>
					<Divider color="gray1" />
				</Container>
			)}
		</>
	);
};
