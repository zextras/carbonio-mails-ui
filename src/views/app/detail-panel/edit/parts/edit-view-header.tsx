/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AsyncThunkAction } from '@reduxjs/toolkit';
import {
	Avatar,
	Button,
	Container,
	Dropdown,
	IconButton,
	MultiButton,
	Padding,
	Row,
	SnackbarManagerContext,
	Text,
	Tooltip,
	useModal
} from '@zextras/carbonio-design-system';
import {
	getBridgedFunctions,
	getCurrentRoute,
	minimizeBoards,
	reopenBoards,
	replaceHistory,
	t,
	useBoard,
	useBoardHooks,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';
import { concat, find, some } from 'lodash';
import React, { FC, ReactElement, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Controller, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { ActionsType } from '../../../../../commons/utils';
import { sendMsg } from '../../../../../store/actions/send-msg';
import { EditViewContextType, MailAttachment } from '../../../../../types';
import { addAttachments } from '../edit-utils';
import { useGetAttachItems } from '../edit-utils-hooks/use-get-attachment-items';
import { useGetIdentities } from '../edit-utils-hooks/use-get-identities';
import { EditViewContext } from './edit-view-context';
import * as StyledComp from './edit-view-styled-components';
import SendLaterModal from './send-later-modal';
import { StoreProvider } from '../../../../../store/redux';

const FromItem = styled(Row)`
	border-radius: 4px;
	cursor: pointer;
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;

type PropType = {
	setShowRouteGuard: (arg: boolean) => void;
	setValue: (
		name: string,
		value: any,
		config?:
			| Partial<{
					shouldValidate: boolean;
					shouldDirty: boolean;
			  }>
			| undefined
	) => void;
	handleSubmit: (
		onValid: SubmitHandler<any>,
		onInvalid?: SubmitErrorHandler<any>
	) => (e?: React.BaseSyntheticEvent) => Promise<void>;
	uploadAttachmentsCb: (files: any) => AsyncThunkAction<any, any, any>;
	updateEditorCb: (data: any, editorId?: string) => void;
	editorId: string;
	saveDraftCb: (arg: any) => any;
	setSending: (arg: boolean) => void;
	action: string | undefined;
};
const EditViewHeader: FC<PropType> = ({
	setShowRouteGuard,
	setValue,
	handleSubmit,
	uploadAttachmentsCb,
	updateEditorCb,
	editorId,
	saveDraftCb,
	setSending,
	action
}) => {
	const { folderId } = useParams<{ folderId: string }>();
	const { prefs, props, attrs } = useUserSettings();
	const { control } = useForm();
	const { editor } = useContext<EditViewContextType>(EditViewContext);
	const [open, setOpen] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [openDD, setOpenDD] = useState(false);
	const [btnLabel, setBtnLabel] = useState<string>(t('label.send', 'Send'));
	const [isDisabled, setIsDisabled] = useState(false);
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();

	const boardUtilities = useBoardHooks();
	const [showRichText, setShowRichtext] = useState(editor?.richText ?? false);
	const [isUrgent, setIsUrgent] = useState(editor?.urgent ?? false);
	const [isReceiptRequested, setIsReceiptRequested] = useState(editor?.requestReadReceipt ?? false);

	// needs to be replace with correct type
	const boardContext = useBoard()?.context;

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

	const onFromDropdownClose = useCallback((): void => {
		setOpen(false);
	}, []);
	const toggleOpen = useCallback(() => setOpen((show) => !show), []);
	const history = useHistory();
	const undoURL = useMemo(
		() => `${history.location.pathname?.split('/mails')?.[1]}${history.location.search}`,
		[history]
	);
	const onBoardClose = useCallback(() => {
		boardUtilities?.closeBoard();
	}, [boardUtilities]);
	const sendMailCb = useCallback(() => {
		minimizeBoards();
		setSending(true);
		setBtnLabel(t('label.sending', 'Sending'));
		setIsDisabled(true);
		setShowRouteGuard(false);
		if (
			action === ActionsType.COMPOSE &&
			(boardContext as unknown as { onConfirm: (arg: any) => void })?.onConfirm
		) {
			(boardContext as unknown as { onConfirm: (arg: any) => void })?.onConfirm({
				editor,
				onBoardClose
			});
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
					actionLabel: t('label.undo', 'Undo'),
					onActionClick: () => {
						reopenBoards();
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

			let countdownSeconds: number =
				(find(props, ['name', 'mails_snackbar_delay'])?._content as unknown as number) ?? 3;

			const countdown = setInterval(() => {
				countdownSeconds -= 1;
				if (countdownSeconds <= 0 || !notCanceled) {
					clearInterval(countdown);
					return;
				}
				infoSnackbar(countdownSeconds);
			}, 1000);

			setTimeout(() => {
				setSending(false);
				if (notCanceled) {
					const activeRoute = getCurrentRoute();
					if (activeRoute?.route === 'mails') {
						folderId ? replaceHistory(`/folder/${folderId}/`) : boardUtilities?.closeBoard();
					} else {
						boardUtilities?.closeBoard();
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
			}, (countdownSeconds as number) * 1000);
		}
	}, [
		setSending,
		setShowRouteGuard,
		action,
		boardContext,
		editor,
		props,
		onBoardClose,
		createSnackbar,
		undoURL,
		updateEditorCb,
		editorId,
		folderId,
		dispatch,
		prefs,
		boardUtilities
	]);

	const createModal = useModal();
	const sendMailAction = useCallback(() => {
		const attachWords = [
			t('messages.modal.send_anyway.attach', 'attach'),
			t('messages.modal.send_anyway.attachment', 'attachment'),
			t('messages.modal.send_anyway.attachments', 'attachments'),
			t('messages.modal.send_anyway.attached', 'attached'),
			t('messages.modal.send_anyway.attaching', 'attaching'),
			t('messages.modal.send_anyway.enclose', 'enclose'),
			t('messages.modal.send_anyway.enclosed', 'enclosed'),
			t('messages.modal.send_anyway.enclosing', 'enclosing')
		];
		const isattachWordsPresent = attachWords.some((el) =>
			editor.text[0].toLowerCase().includes(el)
		);
		if ((isattachWordsPresent && !editor?.attachmentFiles.length) || !editor?.subject) {
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
					<StoreProvider>
						<Text overflow="break-word" style={{ paddingTop: '1rem' }}>
							{/* eslint-disable-next-line no-nested-ternary */}
							{isattachWordsPresent && !editor?.attachmentFiles.length && !editor?.subject
								? t(
										'messages.modal.send_anyway.no_subject_no_attachments',
										'Email subject is empty and you didn’t attach any files.'
								  )
								: !editor?.subject
								? t('messages.modal.send_anyway.no_subject', 'Email subject is empty.')
								: t('messages.modal.send_anyway.no_attachments', 'You didn’t attach any files.')}
						</Text>

						<Text overflow="break-word" style={{ paddingBottom: '1rem' }}>
							{t('messages.modal.send_anyway.second', 'Do you still want to send the email?')}
						</Text>
					</StoreProvider>
				)
			});
		} else {
			sendMailCb();
		}
	}, [editor?.attachmentFiles.length, editor?.subject, editor.text, createModal, sendMailCb]);

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
				boardUtilities?.closeBoard();
			}
		});
	}, [boardUtilities, createSnackbar, editor, saveDraftCb]);

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
					<StoreProvider>
						<SendLaterModal
							// TODO : fix it inside shell
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							onClose={(): void => closeModal()}
							dispatch={dispatch}
							editor={editor}
							closeBoard={boardUtilities?.closeBoard}
							folderId={folderId}
							setShowRouteGuard={setShowRouteGuard}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [boardUtilities?.closeBoard, dispatch, editor, folderId, setShowRouteGuard]);

	const isSendLaterAllowed = useMemo(
		() => attrs?.zimbraFeatureMailSendLaterEnabled === 'TRUE',
		[attrs?.zimbraFeatureMailSendLaterEnabled]
	);
	const multiBtnActions = useMemo(
		() => [
			...(isSendLaterAllowed
				? [
						{
							id: 'delayed_mail',
							icon: 'ClockOutline',
							label: t('label.send_later', 'Send later'),
							click: openSendLaterModal
						}
				  ]
				: [])
		],
		[openSendLaterModal, isSendLaterAllowed]
	);
	const noName = useMemo(() => t('label.no_name', '<No Name>'), []);
	return (
		<>
			<Row
				padding={{ all: 'small' }}
				orientation="horizontal"
				mainAlignment={hasIdentity ? 'space-between' : 'flex-end'}
				width="100%"
			>
				{hasIdentity && (
					<FromItem orientation="horizontal" mainAlignment="space-between">
						<Tooltip label={activeFrom?.label} maxWidth="100%" placement="top-start">
							<Dropdown
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								items={identitiesList.map((identity, index) => ({
									...identity,
									id: index
								}))}
								width="fit"
								maxWidth="100%"
								forceOpen={open}
								onClose={onFromDropdownClose}
								selectedBackgroundColor="highlight"
							>
								<Row
									onClick={toggleOpen}
									width="100%"
									orientation="horizontal"
									height="fit"
									wrap="nowrap"
									padding={{ all: 'small' }}
								>
									<Avatar label={from?.displayName || from?.fullName || noName} />
									<Container
										width="100%"
										crossAlignment="flex-start"
										height="fit"
										padding={{ left: 'medium', right: 'medium' }}
									>
										<Text weight="bold">
											{from?.displayName || from?.fullName || from?.address}
										</Text>
										<Text color="gray1" size="small">
											{from?.address}
										</Text>
									</Container>
									<IconButton
										icon={open ? 'ChevronUpOutline' : 'ChevronDownOutline'}
										onClick={(): null => null}
									/>
								</Row>
							</Dropdown>
						</Tooltip>
					</FromItem>
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
								onChange={(): Promise<any> =>
									addAttachments(
										saveDraftCb,
										uploadAttachmentsCb,
										editor,
										inputRef?.current?.files
										// eslint-disable-next-line @typescript-eslint/ban-ts-comment
										// @ts-ignore
									).then((data: MailAttachment) => {
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
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
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
								onClick={(): void => {
									handleSubmit(onSave)();
								}}
								label={`${t('label.save', 'Save')}`}
							/>
						</Padding>
					)}
					{
						<Padding left="large">
							{multiBtnActions.length > 0 ? (
								<MultiButton
									data-testid="BtnSendMailMulti"
									label={btnLabel}
									onClick={sendMailAction}
									disabledPrimary={isSendDisabled}
									disabledSecondary={isSendDisabled}
									items={multiBtnActions}
								/>
							) : (
								<Button
									color="primary"
									data-testid="BtnSendMail"
									disabled={isSendDisabled}
									icon="PaperPlane"
									onClick={sendMailAction}
									label={btnLabel}
								/>
							)}
						</Padding>
					}
				</Row>
			</Row>
		</>
	);
};

export default EditViewHeader;
