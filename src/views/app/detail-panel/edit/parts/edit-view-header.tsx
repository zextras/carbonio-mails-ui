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
	FOLDERS,
	getBridgedFunctions,
	getCurrentRoute,
	getUserAccount,
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
import { ActionsType, LineType } from '../../../../../commons/utils';
import { sendMsg } from '../../../../../store/actions/send-msg';
import {
	BoardContext,
	EditViewContextType,
	MailAttachment,
	MailsEditor,
	IdentityType
} from '../../../../../types';
import { addAttachments } from '../edit-utils';
import { useGetAttachItems } from '../edit-utils-hooks/use-get-attachment-items';
import { useGetIdentities } from '../edit-utils-hooks/use-get-identities';
import { EditViewContext } from './edit-view-context';
import * as StyledComp from './edit-view-styled-components';
import SendLaterModal from './send-later-modal';
import { StoreProvider } from '../../../../../store/redux';
import { getSignatureValue } from '../../../../../helpers/signatures';
import { convertHtmlToPlainText } from '../../../../../carbonio-ui-commons/utils/text/html';
import { useAppDispatch } from '../../../../../hooks/redux';

/**
 * Match the first string which is between a
 * signature separator and either a quoted text
 * delimiter or the end of the content
 */
const PLAINTEXT_SIGNATURE_REGEX = new RegExp(
	`^(${LineType.SIGNATURE_PRE_SEP}\\n)(((?!\\s${LineType.PLAINTEXT_SEP}$).)*)`,
	'ms'
);

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
	changeEditorText: (text: [string, string]) => void;
	action: string | undefined;
	editor: MailsEditor;
};

/**
 * Replaces the signature in a HTML message body.
 *
 * @param body - HTML message body
 * @param newSignature - content of the new signature
 */
const replaceSignatureOnHtmlBody = (body: string, newSignature: string): string => {
	const doc = new DOMParser().parseFromString(body, 'text/html');

	// Get the element which wraps the signature
	const signatureWrappers = doc.getElementsByClassName(LineType.SIGNATURE_CLASS);

	let signatureWrapper = null;

	// Locate the separator
	const separator = doc.getElementById(LineType.HTML_SEP_ID);

	// Locate the first signature. If no wrapper is found then the unchanged mail body is returned
	signatureWrapper = signatureWrappers.item(0);
	if (signatureWrapper == null) {
		return body;
	}

	/*
	 * If a separator is present it should be located after the signature
	 * (the content after the separator is quoted text which shouldn't be altered).
	 * Otherwise the original body content is returned
	 */
	if (
		separator &&
		signatureWrapper.compareDocumentPosition(separator) !== Node.DOCUMENT_POSITION_FOLLOWING
	) {
		return body;
	}

	signatureWrapper.innerHTML = newSignature;
	return doc.documentElement.innerHTML;
};

/**
 * Replaces the signature in a plain text message body
 *
 * @param body - plain text message body
 * @param newSignature - signature content
 */
export const replaceSignatureOnPlainTextBody = (body: string, newSignature: string): string => {
	// If no eligible signature is found the original body is returned
	if (!body.match(PLAINTEXT_SIGNATURE_REGEX)) {
		return body;
	}

	// Locate the first quoted text separator
	const quotedTextSeparatorPos = body.indexOf(LineType.PLAINTEXT_SEP);

	const match = body.match(PLAINTEXT_SIGNATURE_REGEX);

	/*
	 * If the body content doesn't match the regex or if it matches it
	 * but after a quoted-text separator (= the target signature is
	 * located inside the quoted text. This could happen when the user
	 * will manually remove the preset signature inside the UNquoted text.
	 */
	if (!match || (quotedTextSeparatorPos >= 0 && quotedTextSeparatorPos < (match.index ?? 0))) {
		return body;
	}

	// Replace the target signature
	return body.replace(PLAINTEXT_SIGNATURE_REGEX, `$1${newSignature}`);
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
	changeEditorText,
	action,
	editor
}) => {
	const { folderId } = useParams<{ folderId: string }>();
	const { prefs, props, attrs } = useUserSettings();
	const { control } = useForm();
	const { setSendLater } = useContext<EditViewContextType>(EditViewContext);
	const [open, setOpen] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [openDD, setOpenDD] = useState(false);
	const [btnLabel, setBtnLabel] = useState<string>(t('label.send', 'Send'));
	const [isDisabled, setIsDisabled] = useState(false);
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useAppDispatch();

	const boardUtilities = useBoardHooks();
	const [showRichText, setShowRichtext] = useState(editor?.richText ?? false);
	const [isUrgent, setIsUrgent] = useState(editor?.urgent ?? false);
	const [isReceiptRequested, setIsReceiptRequested] = useState(editor?.requestReadReceipt ?? false);
	// needs to be replaced with correct type
	const boardContext = useBoard<BoardContext>()?.context;

	const isSendDisabled = useMemo(() => {
		const participants = concat(editor?.to, editor?.bcc, editor?.cc);
		return isDisabled || participants.length === 0 || some(participants, { error: true });
	}, [isDisabled, editor]);

	const changeSignature = (isNew: boolean, id = ''): void => {
		const editorText = editor.text;
		const signatureValue = id !== '' ? getSignatureValue(getUserAccount(), id) : '';
		const plainSignatureValue =
			signatureValue !== '' ? `\n${convertHtmlToPlainText(signatureValue)}\n\n` : '';
		const htmlContent = replaceSignatureOnHtmlBody(editorText[1], signatureValue);
		const plainContent = replaceSignatureOnPlainTextBody(editorText[0], plainSignatureValue);
		updateEditorCb({
			text: [plainContent, htmlContent]
		});
		changeEditorText([plainContent, htmlContent]);
	};

	const onFromChange = (fr: Partial<IdentityType> | undefined): void => {
		if (fr) {
			if (action === ActionsType.NEW) {
				changeSignature(true, fr.zimbraPrefDefaultSignatureId);
			} else {
				changeSignature(false, fr?.zimbraPrefForwardReplySignatureId);
			}
		}
	};
	const { from, activeFrom, identitiesList, hasIdentity } = useGetIdentities({
		updateEditorCb,
		setOpen,
		onFromChange,
		editorId: editor?.editorId,
		currentMessage: editor?.original,
		originalMessage:
			action === ActionsType.REPLY_ALL ||
			action === ActionsType.REPLY ||
			action === ActionsType.FORWARD
				? editor?.original
				: undefined,
		folderId: boardContext?.folderId ?? FOLDERS.INBOX
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
		setValue,
		changeEditorText
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
		const isattachWordsPresent = attachWords.some((el) => {
			const [msgContent] = editor.richText
				? editor.text[1].split(LineType.HTML_SEP_ID)
				: editor.text[0].split(LineType.PLAINTEXT_SEP);
			return msgContent.toLowerCase().includes(el);
		});
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
	}, [
		editor?.attachmentFiles.length,
		editor?.subject,
		editor.richText,
		editor.text,
		createModal,
		sendMailCb
	]);

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
							setSendLater={setSendLater}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [boardUtilities?.closeBoard, dispatch, editor, folderId, setSendLater, setShowRouteGuard]);

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
								data-testid="from-dropdown"
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
										<Text weight="bold" data-testid="from-identity-display-name">
											{from?.displayName || from?.fullName || from?.address}
										</Text>
										<Text color="gray1" size="small" data-testid="from-identity-address">
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
						render={({ field: { onChange, value } }): ReactElement => (
							<StyledComp.FileInput
								type="file"
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								ref={inputRef}
								data-testid="file-input"
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
								data-testid="BtnSaveMail"
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
