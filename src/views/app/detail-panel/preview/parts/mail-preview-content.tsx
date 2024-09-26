/* eslint-disable no-nested-ternary */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';

import { Collapse, Container, Padding, Row } from '@zextras/carbonio-design-system';
import {
	getIntegratedComponent,
	useUserAccounts,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';

import { getAttachmentParts } from '../../../../../helpers/attachments';
import { useAppDispatch } from '../../../../../hooks/redux';
import { useRequestDebouncedMessage } from '../../../../../hooks/use-request-debounced-message';
import SharedInviteReply from '../../../../../integrations/shared-invite-reply';
import { msgAction } from '../../../../../store/actions';
import type { MailMessage, OpenEmlPreviewType } from '../../../../../types';
import AttachmentsBlock from '../attachments-block';
import ReadReceiptModal from '../read-receipt-modal';
import { MailMessageRenderer } from '../../../../../commons/mail-message-renderer/mail-message-renderer';

const [InviteResponse, integrationAvailable] = getIntegratedComponent('invites-reply');
type MailContentProps = {
	message: MailMessage;
	isMailPreviewOpen: boolean;
	isExternalMessage?: boolean;
	isInsideExtraWindow?: boolean;
	openEmlPreview?: OpenEmlPreviewType;
	showingEml?: boolean;
};
export const MailContent = ({
	message,
	isMailPreviewOpen,
	isExternalMessage = false,
	openEmlPreview,
	isInsideExtraWindow = false,
	showingEml = false
}: MailContentProps): React.JSX.Element => {
	const [showModal, setShowModal] = useState(true);
	const dispatch = useAppDispatch();
	const accounts = useUserAccounts();
	const { prefs } = useUserSettings();
	const moveToTrash = useCallback(() => {
		dispatch(
			msgAction({
				operation: `trash`,
				ids: [message.id]
			})
		);
	}, [message, dispatch]);

	useRequestDebouncedMessage(message.id, message?.isComplete);

	const showAppointmentInvite = useMemo(
		() =>
			message.isInvite &&
			message.invite?.[0]?.comp &&
			message.isInvite &&
			(message.invite?.[0]?.comp[0].method === 'REQUEST' ||
				message.invite?.[0]?.comp[0].method === 'COUNTER') &&
			integrationAvailable &&
			InviteResponse,
		[message]
	);

	const readReceiptSetting = useMemo(() => prefs?.zimbraPrefMailSendReadReceipts, [prefs]);
	const showReadReceiptModal = useMemo(
		() =>
			(showModal &&
				message.isReadReceiptRequested &&
				!message?.isSentByMe &&
				readReceiptSetting === 'prompt') ??
			false,
		[showModal, message, readReceiptSetting]
	);

	const showShareInvite = useMemo(
		() =>
			message &&
			message?.shr &&
			message?.shr?.length > 0 &&
			message.fragment &&
			!message?.fragment.includes('revoked') &&
			!message?.fragment.includes('has accepted') &&
			!message?.fragment.includes('has declined'),
		[message]
	);

	const onModalClose = useCallback(() => {
		setShowModal(false);
	}, []);
	const loggedInUser = useMemo(() => accounts[0]?.name, [accounts]);
	const isAttendee = useMemo(
		() => message.invite?.[0]?.comp?.[0]?.or?.a !== loggedInUser,
		[loggedInUser, message]
	);

	const { inviteId, participationStatus } = {
		/*
		 * Compose the invite ID
		 * The invite ID is composed by the following fields:
		 * - the appointment ID (if present)
		 * - the message ID
		 * If the 2 fields are both present they will be separated by a hyphen otherwise only the message ID will be used
		 *
		 * The appointment ID is present only if the appointment was automatically added to the calendar (following the
		 * user's preferences)
		 */
		inviteId: showAppointmentInvite
			? message.invite[0].comp[0].apptId
				? `${message.invite[0].comp[0].apptId}-${message.id}`
				: message.id
			: '',

		// Compose the participation status
		participationStatus:
			showAppointmentInvite && message.invite[0].replies
				? message.invite[0].replies[0].reply[0].ptst
				: ''
	};

	const parts = useMemo(
		() => (message.parts ? getAttachmentParts(message.parts) : []),
		[message?.parts]
	);

	const participants = useMemo(() => message?.participants, [message?.participants]);
	return (
		<Collapse
			open={isMailPreviewOpen}
			crossSize="100%"
			orientation="vertical"
			disableTransition
			data-testid="MailMessageRendererCollapse"
			style={{ height: '100%' }}
		>
			{message.isComplete && (
				<Container
					data-testid="MessageBody"
					width="100%"
					height="100%"
					crossAlignment="stretch"
					padding={
						isInsideExtraWindow ? { vertical: 'small' } : { horizontal: 'large', vertical: 'small' }
					}
					background="gray6"
				>
					<Row>
						<AttachmentsBlock
							messageId={message.id}
							messageSubject={message.subject}
							messageAttachments={message.attachments}
							isExternalMessage={isExternalMessage}
							openEmlPreview={openEmlPreview}
						/>
					</Row>
					<Padding height="100%" width="100%" vertical="medium" style={{ overflow: 'auto' }}>
						{showAppointmentInvite ? (
							<Container width="100%">
								<InviteResponse
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									onLoadChange={(): null => null}
									mailMsg={message}
									inviteId={inviteId}
									participationStatus={participationStatus}
									to={filter(message.participants, { type: 'f' })}
									invite={message.invite}
									method={message.invite[0]?.comp[0].method}
									moveToTrash={moveToTrash}
									isAttendee={isAttendee}
									parent={message.parent}
								/>
							</Container>
						) : showShareInvite ? (
							<SharedInviteReply
								// title={message?.fragment?.split('Shared item:')[0]}
								sharedContent={message.shr[0].content}
								mailMsg={message}
							/>
						) : (
							<MailMessageRenderer
								parts={parts}
								body={message.body}
								id={message.id}
								fragment={message.fragment}
								participants={participants}
								isInsideExtraWindow={isInsideExtraWindow}
								showingEml={showingEml}
							/>
						)}
					</Padding>
					<ReadReceiptModal
						open={showReadReceiptModal}
						onClose={onModalClose}
						message={message}
						readReceiptSetting={readReceiptSetting}
					/>
				</Container>
			)}
		</Collapse>
	);
};
