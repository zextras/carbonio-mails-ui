/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Controller } from 'react-hook-form';

import { useTranslation } from 'react-i18next';
import {
	Button,
	Dropdown,
	Padding,
	Row,
	Tooltip,
	SnackbarManagerContext,
	IconButton,
	MultiButton,
	useModal,
	Text
} from '@zextras/carbonio-design-system';
import { concat, some } from 'lodash';
import { useDispatch } from 'react-redux';
import {
	getBridgedFunctions,
	getCurrentRoute,
	replaceHistory,
	useBoardConfig,
	useRemoveCurrentBoard,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { useHistory } from 'react-router-dom';
import { EditViewContext } from './edit-view-context';
import { useGetIdentities } from '../edit-utils-hooks/use-get-identities';
import { useGetAttachItems } from '../edit-utils-hooks/use-get-attachment-items';
import * as StyledComp from './edit-view-styled-components';
import { addAttachments } from '../edit-utils';
import { CreateSnackbar, mailAttachment } from '../../../../../types';
import { sendMsg } from '../../../../../store/actions/send-msg';
import { ActionsType } from '../../../../../commons/utils';
import SendLaterModal from './send-later-modal';

type PropType = {
	setShowRouteGuard: (arg: boolean) => void;
	setValue: (arg: unknown) => void;
	handleSubmit: (arg: () => void) => void;
	uploadAttachmentsCb: () => void;
};
const EditViewHeader: FC<PropType> = ({
	setShowRouteGuard,
	setValue,
	handleSubmit,
	uploadAttachmentsCb
}) => {
	const [t] = useTranslation();

	const { prefs } = useUserSettings();
	const { control, editor, updateEditorCb, editorId, saveDraftCb, folderId, action } =
		useContext(EditViewContext);
	const [open, setOpen] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [openDD, setOpenDD] = useState(false);
	const [btnLabel, setBtnLabel] = useState<string>(t('label.send', 'Send'));
	const [isDisabled, setIsDisabled] = useState(false);
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();
	const [showRichText, setShowRichtext] = useState(editor?.richText ?? false);
	const [isUrgent, setIsUrgent] = useState(editor?.urgent ?? false);
	const [isReceiptRequested, setIsReceiptRequested] = useState(editor?.requestReadReceipt ?? false);
	// needs to be replace with correct type
	const boardContext: { onConfirm: (arg: any) => void } = useBoardConfig();

	const closeBoard = useRemoveCurrentBoard();

	const isSendDisabled = useMemo(() => {
		const participants = concat(editor?.to, editor?.bcc, editor?.cc);
		return isDisabled || participants.length === 0 || some(participants, { error: true });
	}, [isDisabled, editor]);

	const { from, activeFrom, identitiesList, hasIdentity } = useGetIdentities({
		updateEditorCb,
		setOpen,
		editorId: editor?.editorId
	});

	const inputRef = useRef<any>();
	const onFileClick = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.value = null;
			inputRef.current.click();
		}
	}, []);

	const attachmentsItems = useGetAttachItems({
		onFileClick,
		setOpenDD,
		editorId,
		updateEditorCb,
		saveDraftCb,
		setValue
	});

	const onClick = (): void => {
		setOpenDD(!openDD);
	};

	const toggleOpen = useCallback(() => setOpen((show) => !show), []);
	const history = useHistory();
	const undoURL = useMemo(
		() => `${history.location.pathname?.split('/mails')?.[1]}${history.location.search}`,
		[history]
	);

	const sendMailCb = useCallback(() => {
		setBtnLabel(t('label.sending', 'Sending'));
		setIsDisabled(true);
		setShowRouteGuard(false);
		if (action === ActionsType.COMPOSE && boardContext?.onConfirm) {
			boardContext?.onConfirm(editor);
		} else {
			let notCanceled = true;
			const oldEditor = { ...editor };
			const infoSnackbar = (remainingTime: number, hideButton = false): void => {
				createSnackbar({
					key: 'send',
					replace: true,
					type: 'info',
					label: t('messages.snackbar.sending_mail_in_count', {
						count: remainingTime,
						defaultValue: 'Sending your message in {{count}} second',
						defaultValue_plural: 'Sending your message in {{count}} seconds'
					}),
					autoHideTimeout: remainingTime * 1000,
					hideButton,
					actionLabel: 'Undo',
					onActionClick: () => {
						notCanceled = false;
						setTimeout(() => updateEditorCb({ ...oldEditor }, editorId), 10);
						replaceHistory(undoURL);
						setBtnLabel(t('label.send', 'Send'));
						setIsDisabled(false);
					}
				});
			};
			setTimeout(() => {
				if (folderId) {
					replaceHistory(`/folder/${folderId}/`);
				}
			}, 10);

			infoSnackbar(3);
			setTimeout(() => notCanceled && infoSnackbar(2), 1000);
			setTimeout(() => notCanceled && infoSnackbar(1), 2000);
			setTimeout(() => {
				if (notCanceled) {
					const activeRoute = getCurrentRoute();
					if (activeRoute?.route === 'mails') {
						folderId ? replaceHistory(`/folder/${folderId}/`) : closeBoard();
					} else {
						closeBoard();
					}
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					dispatch(sendMsg({ editorId, prefs })).then((res) => {
						if (res.type.includes('fulfilled')) {
							createSnackbar({
								key: `mail-${editorId}`,
								replace: true,
								type: 'success',
								label: t('messages.snackbar.mail_sent', 'Message sent'),
								autoHideTimeout: 3000,
								hideButton: true
							});
						} else {
							createSnackbar({
								key: `mail-${editorId}`,
								replace: true,
								type: 'error',
								label: t('label.error_try_again', 'Something went wrong, please try again'),
								autoHideTimeout: 3000,
								hideButton: true
							});
							setIsDisabled(false);
						}
					});
				}
			}, 3000);
		}
	}, [
		t,
		setShowRouteGuard,
		action,
		boardContext,
		editor,
		createSnackbar,
		undoURL,
		updateEditorCb,
		editorId,
		folderId,
		dispatch,
		prefs,
		closeBoard
	]);

	const createModal = useModal();
	const sendMailAction = useCallback(() => {
		if (editor?.subject) {
			sendMailCb();
		} else {
			const closeModal = createModal({
				title: t('header.attention', 'Attention'),
				confirmLabel: t('action.ok', 'Ok'),
				dismissLabel: t('label.cancel', 'Cancel'),
				showCloseIcon: true,
				onConfirm: () => {
					sendMailCb();
					closeModal();
				},
				onClose: () => {
					closeModal();
				},
				onSecondaryAction: () => {
					closeModal();
				},
				children: (
					<>
						<Text overflow="break-word" style={{ paddingTop: '16px' }}>
							{t(
								'messages.modal.send_anyway.first',
								"Email subject is empty and you didn't attach any files."
							)}
						</Text>
						<Text overflow="break-word" style={{ paddingBottom: '16px' }}>
							{t('messages.modal.send_anyway.second', 'Do you still want to send the email?')}
						</Text>
					</>
				)
			});
		}
	}, [editor?.subject, createModal, t, sendMailCb]);

	const onSave = useCallback(() => {
		saveDraftCb(editor);
		createSnackbar({
			key: 'send',
			replace: true,
			type: 'info',
			label: t('messages.snackbar.mail_saved_to_drafts', 'Mail saved to drafts'),
			autoHideTimeout: 3000,
			actionLabel: t('action.goto_drafts', 'Go to drafts'),
			hideButton: true,
			onActionClick: () => {
				// todo: redirect to folder/6 i.e. Drafts
				replaceHistory(`/folder/6/`);
				closeBoard();
			}
		});
	}, [closeBoard, createSnackbar, editor, saveDraftCb, t]);

	const onDropdownClose = useCallback((): void => {
		setShowDropdown(false);
	}, []);
	const onIconClick = useCallback((ev: { stopPropagation: () => void }): void => {
		ev.stopPropagation();
		setShowDropdown((o) => !o);
	}, []);

	const toggleRichTextEditor = useCallback(() => {
		updateEditorCb({
			richText: !showRichText
		});
		setShowRichtext((show: boolean) => !show);
	}, [showRichText, updateEditorCb]);

	const toggleImportant = useCallback(() => {
		updateEditorCb({
			urgent: !isUrgent
		});
		setIsUrgent((urgent: boolean) => !urgent);
	}, [isUrgent, updateEditorCb]);

	const toggleReceiptRequest = useCallback(() => {
		updateEditorCb({
			requestReadReceipt: !isReceiptRequested
		});
		setIsReceiptRequested((requested: boolean) => !requested);
	}, [isReceiptRequested, updateEditorCb]);

	const composerActions = useMemo(
		() => [
			{
				id: 'richText',
				label: showRichText
					? t('tooltip.disable_rich_text', 'Disable rich text editor')
					: t('tooltip.enable_rich_text', 'Enable rich text editor'),
				click: toggleRichTextEditor
			},
			{
				id: 'urgent',
				label: isUrgent
					? t('label.mark_as_un_important', 'Mark as unimportant')
					: t('label.mark_as_important', 'Mark as important'),
				click: toggleImportant
			},
			{
				id: 'read_receipt',
				label: isReceiptRequested
					? t('label.remove_request_receipt', 'Remove read receipt request')
					: t('label.request_receipt', 'Request read receipt'),
				click: toggleReceiptRequest
			}
		],
		[
			showRichText,
			t,
			toggleRichTextEditor,
			isUrgent,
			toggleImportant,
			isReceiptRequested,
			toggleReceiptRequest
		]
	);

	const openSendLaterModal = useCallback(() => {
		const closeModal = getBridgedFunctions()?.createModal(
			{
				maxHeight: '90vh',
				children: (
					<>
						<SendLaterModal
							// TODO : fix it inside shell
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							onClose={(): void => closeModal()}
							dispatch={dispatch}
							editor={editor}
							closeBoard={closeBoard}
						/>
					</>
				)
			},
			true
		);
	}, [closeBoard, dispatch, editor]);
	return (
		<>
			<Row
				padding={{ all: 'small' }}
				orientation="horizontal"
				mainAlignment={hasIdentity ? 'space-between' : 'flex-end'}
				width="100%"
			>
				{hasIdentity && (
					<Row>
						<Tooltip label={activeFrom.label} maxWidth="100%" placement="top-start">
							<Dropdown
								items={identitiesList}
								width="fit"
								maxWidth="100%"
								forceOpen={open}
								onClose={toggleOpen}
								selectedBackgroundColor="highlight"
							>
								<Button
									label={t('label.from_identity', {
										identity: from?.fullName || from?.address,
										defaultValue: 'From: {{identity}}'
									})}
									icon={open ? 'ChevronUpOutline' : 'ChevronDownOutline'}
									onClick={toggleOpen}
									type="outlined"
									style={{ maxWidth: '280px' }}
								/>
							</Dropdown>
						</Tooltip>
					</Row>
				)}
				<Row>
					<Controller
						name="attach"
						control={control}
						defaultValue={editor.attach || {}}
						render={({ onChange, value }): ReactElement => (
							<StyledComp.FileInput
								type="file"
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								ref={inputRef}
								onChange={(): void =>
									addAttachments(
										saveDraftCb,
										uploadAttachmentsCb,
										editor,
										inputRef?.current?.files
									).then((data: mailAttachment) => {
										updateEditorCb({
											attach: { ...value, mp: data }
										});
										onChange({ ...value, mp: data });
									})
								}
								multiple
							/>
						)}
					/>
					{action !== ActionsType.COMPOSE && (
						<Tooltip label={t('tooltip.add_attachments', 'Add attachments')}>
							<Dropdown
								items={attachmentsItems}
								display="inline-block"
								width="fit"
								forceOpen={openDD}
							>
								<StyledComp.ResizedIconCheckbox
									onChange={(): null => null}
									icon="AttachOutline"
									onClick={onClick}
								/>
							</Dropdown>
						</Tooltip>
					)}
					<Dropdown
						items={composerActions}
						forceOpen={showDropdown}
						onClose={onDropdownClose}
						selectedBackgroundColor="gray5"
					>
						<IconButton size="large" icon="MoreVertical" onClick={onIconClick} />
					</Dropdown>
					{action !== ActionsType.COMPOSE && (
						<Padding left="large">
							<Button
								type="outlined"
								onClick={(): void => handleSubmit(onSave)}
								label={`${t('label.save', 'Save')}`}
							/>
						</Padding>
					)}
					<Padding left="large">
						<MultiButton
							label={btnLabel}
							onClick={sendMailAction}
							disabledPrimary={isSendDisabled}
							disabledSecondary={isSendDisabled}
							items={[
								{
									id: 'delayed_mail',
									icon: 'ClockOutline',
									label: t('label.send_later', 'Send later'),
									click: openSendLaterModal
								}
							]}
						/>
					</Padding>
				</Row>
			</Row>
		</>
	);
};

export default EditViewHeader;
