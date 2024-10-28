/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import {
	Container,
	Row,
	Padding,
	Icon,
	Text,
	Button,
	Divider
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import PreviewHeader from './preview-header';
import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { getFolderIdParts } from '../../../../../carbonio-ui-commons/helpers/folders';
import { useMsgSetNotSpamFn } from '../../../../../hooks/actions/use-msg-set-not-spam';
import { MailMessage } from '../../../../../types';

type MailPreviewBlockType = {
	message: MailMessage;
	open: boolean;
	onClick: () => void;
	isExternalMessage?: boolean;
	messagePreviewFactory: () => React.JSX.Element;
};
export const MailPreviewBlock: FC<MailPreviewBlockType> = ({
	message,
	open,
	onClick,
	isExternalMessage = false,
	messagePreviewFactory
}) => {
	const { folderId, itemId } = useParams<{ folderId: string; itemId: string }>();
	const compProps = useMemo(
		() => ({ message, onClick, open, isExternalMessage, messagePreviewFactory }),
		[message, onClick, open, isExternalMessage, messagePreviewFactory]
	);
	const shouldReplaceHistory = useMemo(() => itemId === message.id, [message.id, itemId]);
	const [t] = useTranslation();

	const { execute } = useMsgSetNotSpamFn({ ids: [message.id], folderId, shouldReplaceHistory });
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
