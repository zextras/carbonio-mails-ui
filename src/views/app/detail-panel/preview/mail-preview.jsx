/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-nested-ternary */
import React, { useMemo, useState, useRef, useCallback, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { filter } from 'lodash';
import {
	useUserAccounts,
	useIntegratedComponent,
	useUserSettings,
	FOLDERS
} from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';
import {
	Container,
	Text,
	Collapse,
	Icon,
	Padding,
	Button,
	Row,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import { useDispatch } from 'react-redux';
import MailMessageRenderer from '../../../../commons/mail-message-renderer';
import AttachmentsBlock from './attachments-block';
import { setMsgAsSpam } from '../../../../ui-actions/message-actions';
import { getMsg, msgAction } from '../../../../store/actions';
import SharedInviteReply from '../../../../integrations/shared-invite-reply';

import PreviewHeader from './parts/preview-header';

const MailContent = ({ message, isMailPreviewOpen }) => {
	const [InviteResponse, integrationAvailable] = useIntegratedComponent('invites-reply');
	const dispatch = useDispatch();
	const accounts = useUserAccounts();
	const moveToTrash = useCallback(() => {
		dispatch(
			msgAction({
				operation: `trash`,
				ids: [message.id]
			})
		);
	}, [message, dispatch]);

	// this is necessary because if somebody click a message in the same conversation
	// already open that message will not be expanded
	useEffect(() => {
		if (!message.isComplete) {
			dispatch(getMsg({ msgId: message.id }));
		}
	}, [dispatch, message.id, message.isComplete]);

	const showAppointmentInvite = useMemo(
		() =>
			message.isInvite &&
			message.invite?.[0]?.comp &&
			message.isInvite &&
			(message.invite?.[0]?.comp[0].method === 'REQUEST' ||
				message.invite?.[0]?.comp[0].method === 'COUNTER') &&
			integrationAvailable &&
			InviteResponse,
		[integrationAvailable, InviteResponse, message]
	);

	const showShareInvite = useMemo(
		() =>
			message.shr &&
			message.shr.length > 0 &&
			!message.fragment.includes('revoked') &&
			!message.fragment.includes('has accepted') &&
			!message.fragment.includes('has declined'),
		[message]
	);

	const loggedInUser = useMemo(() => accounts[0]?.name, [accounts]);
	const isAttendee = useMemo(
		() => message.invite?.[0]?.comp?.[0]?.or?.a !== loggedInUser,
		[loggedInUser, message]
	);

	const collapsedContent = useMemo(
		() => (
			<Container
				data-testid="MessageBody"
				width="100%"
				height="fit"
				crossAlignment="stretch"
				padding={{ horizontal: 'large', vertical: 'small' }}
				background="gray6"
			>
				<Row>
					<AttachmentsBlock message={message} />
				</Row>
				<Padding style={{ width: '100%' }} vertical="medium">
					{showAppointmentInvite ? (
						<Container width="100%">
							<InviteResponse
								// eslint-disable-next-line @typescript-eslint/no-empty-function
								onLoadChange={() => {}}
								mailMsg={message}
								inviteId={`${message.invite[0].comp[0].apptId}-${message.id}`}
								participationStatus={
									message.invite[0].replies ? message.invite[0].replies[0].reply[0].ptst : ''
								}
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
							title={message.fragment.split('Shared item:')[0]}
							sharedContent={message.shr[0].content}
							mailMsg={message}
						/>
					) : (
						<MailMessageRenderer
							key={message.id}
							mailMsg={message}
							// eslint-disable-next-line @typescript-eslint/no-empty-function
							onLoadChange={() => {}}
						/>
					)}
				</Padding>
			</Container>
		),
		[message, InviteResponse, moveToTrash, showShareInvite, showAppointmentInvite, isAttendee]
	);
	return (
		<Collapse
			open={isMailPreviewOpen}
			crossSize="100%"
			orientation="vertical"
			disableTransition
			data-testid="MailMessageRendererCollapse"
		>
			{message.isComplete && collapsedContent}
		</Collapse>
	);
};

const MailPreviewBlock = ({ message, open, onClick }) => {
	const [t] = useTranslation();
	const { folderId } = useParams();

	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();
	const compProps = useMemo(() => ({ message, onClick, open }), [message, onClick, open]);
	const markAsNotSpam = useCallback(
		() =>
			setMsgAsSpam({
				ids: [message.id],
				value: true,
				t,
				dispatch,
				createSnackbar,
				shouldReplaceHistory: true,
				folderId
			}).click(),
		[createSnackbar, dispatch, folderId, message.id, t]
	);
	return (
		<>
			{folderId === FOLDERS.SPAM && (
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
			{message && <PreviewHeader compProps={compProps} />}
		</>
	);
};

export default function MailPreview({ message, expanded, isAlone, isMessageView }) {
	const mailContainerRef = useRef(undefined);
	const settings = useUserSettings();
	const timezone = useMemo(
		() => settings?.prefs.zimbraPrefTimeZoneId,
		[settings?.prefs.zimbraPrefTimeZoneId]
	);
	const [open, setOpen] = useState(expanded);

	const onClick = useCallback(() => {
		setOpen((o) => !o);
	}, []);

	const isMailPreviewOpen = useMemo(
		() => (isMessageView ? true : isAlone ? true : open),
		[isAlone, isMessageView, open]
	);
	return (
		<Container ref={mailContainerRef} height="fit" data-testid={`MailPreview-${message.id}`}>
			<MailPreviewBlock
				onClick={onClick}
				message={message}
				timezone={timezone}
				open={isMailPreviewOpen}
			/>

			<Container
				width="fill"
				height="fit"
				style={{
					overflowY: 'auto'
				}}
			>
				{open && <MailContent message={message} isMailPreviewOpen={isMailPreviewOpen} />}
			</Container>
		</Container>
	);
}
