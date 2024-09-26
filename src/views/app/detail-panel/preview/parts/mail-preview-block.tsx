/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import {
	Container,
	Row,
	Padding,
	Icon,
	Text,
	Button,
	Divider
} from '@zextras/carbonio-design-system';
import { t } from 'i18next';
import { useParams } from 'react-router-dom';

import PreviewHeader from './preview-header';
import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { getFolderIdParts } from '../../../../../carbonio-ui-commons/helpers/folders';
import { MessageActionsDescriptors } from '../../../../../constants';
import { MailMessage, MessageAction } from '../../../../../types';
import { findMessageActionById } from '../../../../../ui-actions/utils';

type MailPreviewBlockType = {
	message: MailMessage;
	open: boolean;
	onClick: () => void;
	messageActions: Array<MessageAction>;
	isExternalMessage?: boolean;
	isInsideExtraWindow?: boolean;
};
export const MailPreviewBlock = ({
	message,
	open,
	onClick,
	messageActions,
	isExternalMessage = false,
	isInsideExtraWindow = false
}: MailPreviewBlockType): React.JSX.Element => {
	const { folderId } = useParams<{ folderId: string }>();
	const compProps = useMemo(
		() => ({ message, onClick, open, isExternalMessage, isInsideExtraWindow }),
		[message, onClick, open, isExternalMessage, isInsideExtraWindow]
	);
	const markAsNotSpam = findMessageActionById(
		messageActions,
		MessageActionsDescriptors.MARK_AS_NOT_SPAM.id
	);

	return (
		<>
			{getFolderIdParts(folderId).id === FOLDERS.SPAM && (
				<Container
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					height="fit"
					padding={{ bottom: 'medium' }}
				>
					<Container background="gray6" orientation="horizontal" padding={{ all: 'small' }}>
						<Row width="50%" display="flex" crossAlignment="center" mainAlignment="baseline">
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
								onClick={markAsNotSpam}
							/>
						</Row>
					</Container>
				</Container>
			)}
			{message && (
				<Row width="fill">
					<PreviewHeader compProps={compProps} actions={messageActions} />
				</Row>
			)}

			{/* External message disclaimer */}
			{isExternalMessage && (
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
