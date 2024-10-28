/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useEffect, useMemo } from 'react';

import { Container, CustomModal, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import ModalFooter from '../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../carbonio-ui-commons/components/modals/modal-header';
import { useAppDispatch } from '../../../../hooks/redux';
import { useUiUtilities } from '../../../../hooks/use-ui-utilities';
import { msgAction } from '../../../../store/actions';
import { sendDeliveryReport } from '../../../../store/actions/send-delivery-request';
import type { MailMessage } from '../../../../types';

type CompProps = {
	open: boolean;
	onClose: () => void;
	message: MailMessage;
	readReceiptSetting: string | undefined | number | Array<string | number>;
};

const ReadReceiptModal: FC<CompProps> = ({
	open,
	onClose,
	message,
	readReceiptSetting
}): ReactElement => {
	const { createSnackbar } = useUiUtilities();
	const dispatch = useAppDispatch();

	const title = useMemo(() => t('label.read_receipt_req', 'Read receipt required'), []);
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
				severity: 'info',
				label: t('label.read_receipt_sent', 'A read receipt has been sent for this message'),
				autoHideTimeout: 3000
			});
		});
		onClose();
	}, [createSnackbar, message.id, onClose]);

	useEffect(() => {
		if (message?.isReadReceiptRequested && readReceiptSetting === 'always' && !message?.isSentByMe)
			onNotify();
	}, [message?.isReadReceiptRequested, onNotify, readReceiptSetting, message?.isSentByMe]);

	const confirmLabel = useMemo(() => t('label.do_not_notify', 'Do not notify'), []);
	const notifyLabel = useMemo(() => t('label.notify', 'Notify'), []);
	const messageLineOne = useMemo(
		() =>
			t(
				'messages.read_receipt_1',
				'The sender of this message has requested to be notified when you read this message.'
			),
		[]
	);
	const messageLineTwo = useMemo(
		() => t('messages.read_receipt_2', 'Do you wish to notify the sender?'),
		[]
	);

	return (
		<CustomModal open={open} onClose={onClose} maxHeight="90vh">
			<Container padding={{ all: 'large' }}>
				<ModalHeader title={title} showCloseIcon onClose={onClose} />
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
