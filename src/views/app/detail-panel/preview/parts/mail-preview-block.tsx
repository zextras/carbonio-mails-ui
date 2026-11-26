/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

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

import { useShouldReplaceHistory } from '../../../../../hooks/use-should-replace-history';
import { useMsgSetNotSpamFn } from 'hooks/actions/use-msg-set-not-spam';
import { MailMessage } from 'types/messages';
import { PreviewHeader } from 'views/app/detail-panel/preview/parts/preview-header';

type MailPreviewBlockType = {
	message: MailMessage;
	open: boolean;
	onClick: () => void;
	isEml?: boolean;
};

const ExternalMessageDisclaimer = ({ isEml }: { isEml: boolean }): React.JSX.Element | null => {
	const [t] = useTranslation();

	if (!isEml) return null;
	return (
		<Container height="fit" background={'white'} padding={{ top: 'large', bottom: 'large' }}>
			<Row background={'gray2'} width="fill" padding={{ all: 'large' }} mainAlignment="flex-start">
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
	);
};

const SpamInfoBanner = ({ message }: { message: MailMessage }): React.JSX.Element | null => {
	const [t] = useTranslation();

	const shouldReplaceHistory = useShouldReplaceHistory(message);

	const { execute } = useMsgSetNotSpamFn({
		ids: [message.id],
		folderId: message.parent,
		shouldReplaceHistory
	});
	if (getFolderIdParts(message.parent).id !== FOLDERS.SPAM) {
		return null;
	}
	return (
		<Container
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			height="fit"
			padding={{ bottom: 'medium' }}
		>
			<Container background={'gray6'} orientation="horizontal" padding={{ all: 'small' }}>
				<Row width="50%" display="flex" crossAlignment="center" mainAlignment="flex-start">
					<Padding right="small">
						<Icon icon="AlertCircleOutline" size="medium" />
					</Padding>
					<Text>{t('messages.snackbar.marked_as_spam', 'You’ve marked this e-mail as Spam')}</Text>
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
	);
};

export const MailPreviewBlock: FC<MailPreviewBlockType> = ({
	message,
	open,
	onClick,
	isEml = false
}) => (
	<>
		<SpamInfoBanner message={message} />
		{message && <PreviewHeader message={message} open={open} onClick={onClick} isEml={isEml} />}
		<ExternalMessageDisclaimer isEml={isEml} />
	</>
);
