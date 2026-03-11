/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useEffect } from 'react';

import { Container, CustomModal, Padding, Text } from '@zextras/carbonio-design-system';
import { t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';

import { msgActionEmailStoreAction } from '../../../../store/emails/actions/msg-action-action';
import { updateMessages } from '../../../../store/emails/store';
import { sendDeliveryReportSoapApi } from 'api/send-delivery-request-soap-api';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { MailMessage } from 'types/messages';

type ReadReceiptModalProps = {
	open: boolean;
	onClose: () => void;
	message: MailMessage;
	readReceiptSetting: string | undefined | number | Array<string | number>;
};

export const ReadReceiptModal: FC<ReadReceiptModalProps> = ({
	open,
	onClose,
	message,
	readReceiptSetting
}): ReactElement => {
	const { createSnackbar } = useUiUtilities();
	const { prefs } = useUserSettings();
	const isMarkManually = prefs?.zimbraPrefMarkMsgRead === '-1';

	const onDoNotConfirm = useCallback(() => {
		const flag = isMarkManually && !message?.read ? 'nu' : 'n';
		msgActionEmailStoreAction({
			operation: 'update',
			ids: [message?.id],
			flag
		}).then(() => {
			updateMessages([{ ...message, isReadReceiptRequested: false }]);
		});
		onClose();
	}, [isMarkManually, message, onClose]);

	const onNotify = useCallback(() => {
		sendDeliveryReportSoapApi(message.id).then(() => {
			updateMessages([{ ...message, isReadReceiptRequested: false }]);
			createSnackbar({
				key: `read-receipt-sent`,
				replace: true,
				hideButton: true,
				severity: 'info',
				label: t('label.read_receipt_sent', 'A read receipt has been sent for this message'),
				autoHideTimeout: 3000
			});
		});
		onClose();
	}, [createSnackbar, message, onClose]);

	useEffect(() => {
		if (message?.isReadReceiptRequested && readReceiptSetting === 'always' && !message?.isSentByMe)
			onNotify();
	}, [message?.isReadReceiptRequested, onNotify, readReceiptSetting, message?.isSentByMe]);

	return (
		<CustomModal open={open} onClose={onClose} maxHeight="90vh">
			<Container padding={{ all: 'large' }}>
				<ModalHeader
					title={t('label.read_receipt_req', 'Read receipt required')}
					showCloseIcon
					onClose={onClose}
				/>
				<Container crossAlignment="flex-start">
					<Text overflow="break-word">
						{t(
							'messages.read_receipt_1',
							'The sender of this message has requested to be notified when you read this message.'
						)}
					</Text>
					<Padding top="large">
						<Text>{t('messages.read_receipt_2', 'Do you wish to notify the sender?')}</Text>
					</Padding>
				</Container>
				<ModalFooter
					onConfirm={onNotify}
					secondaryAction={onDoNotConfirm}
					secondaryLabel={t('label.do_not_notify', 'Do not notify')}
					label={t('label.notify', 'Notify')}
					secondaryBtnType="outlined"
					secondaryColor="primary"
				/>
			</Container>
		</CustomModal>
	);
};
