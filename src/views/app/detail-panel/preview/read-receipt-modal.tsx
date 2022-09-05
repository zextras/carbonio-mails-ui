/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useContext, useEffect, useMemo } from 'react';
import {
	CustomModal,
	Text,
	Container,
	Padding,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import ModalFooter from '../../../sidebar/commons/modal-footer';
import { ModalHeader } from '../../../sidebar/commons/modal-header';
import { msgAction } from '../../../../store/actions';
import { sendDeliveryReport } from '../../../../store/actions/send-delivery-request';
import { CreateSnackbar, MailMessage } from '../../../../types';

type CompProps = {
	open: boolean;
	onClose: () => void;
	message: MailMessage;
	readReceiptSetting: string;
};

const ReadReceiptModal: FC<CompProps> = ({
	open,
	onClose,
	message,
	readReceiptSetting
}): ReactElement => {
	const dispatch = useDispatch();

	const [t] = useTranslation();
	const createSnackbar = useContext(SnackbarManagerContext);
	const title = useMemo(() => t('label.read_receipt_req', 'Read receipt required'), [t]);
	const onConfirm = useCallback(() => {
		dispatch(
			msgAction({
				operation: 'update',
				ids: [message?.id],
				flag: 'n'
			})
		);
	}, [dispatch, message?.id]);

	const onNotify = useCallback(() => {
		sendDeliveryReport(message.id).then(() => {
			createSnackbar({
				key: `read-receipt-sent`,
				replace: true,
				hideButton: true,
				type: 'info',
				label: t('label.read_receipt_sent', 'A read receipt has been sent for this message'),
				autoHideTimeout: 3000
			});
		});
		onClose();
	}, [createSnackbar, message.id, onClose, t]);

	useEffect(() => {
		if (message?.isReadReceiptRequested && readReceiptSetting === 'always' && !message?.isSentByMe)
			onNotify();
	}, [message?.isReadReceiptRequested, onNotify, readReceiptSetting, message?.isSentByMe]);

	const confirmLabel = useMemo(() => t('label.do_not_notify', 'Do not notify'), [t]);
	const notifyLabel = useMemo(() => t('label.notify', 'Notify'), [t]);
	const messageLineOne = useMemo(
		() =>
			t(
				'messages.read_receipt_1',
				'The sender of this message has requested to be notified when you read this message.'
			),
		[t]
	);
	const messageLineTwo = useMemo(
		() => t('messages.read_receipt_2', 'Do you wish to notify the sender?'),
		[t]
	);

	return (
		<CustomModal open={open} onClose={(): null => null} maxHeight="90vh">
			<Container padding={{ all: 'large' }}>
				<ModalHeader title={title} />
				<Container crossAlignment="flex-start">
					<Text overflow="break-word">{messageLineOne}</Text>
					<Padding top="large">
						<Text>{messageLineTwo}</Text>
					</Padding>
				</Container>
				<ModalFooter
					onConfirm={onNotify}
					secondaryAction={onConfirm}
					secondaryLabel={confirmLabel}
					label={notifyLabel}
					secondaryBtnType="outlined"
					secondaryColor="primary"
				/>
			</Container>
		</CustomModal>
	);
};

export default ReadReceiptModal;
