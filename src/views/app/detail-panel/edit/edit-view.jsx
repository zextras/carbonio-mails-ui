/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import {
	Button,
	Catcher,
	ChipInput,
	Collapse,
	Container,
	Dropdown,
	EmailComposerInput,
	Icon,
	IconButton,
	IconCheckbox,
	Padding,
	RichTextEditor,
	Row,
	Text,
	Tooltip,
	Select
} from '@zextras/carbonio-design-system';
import { useDispatch, useSelector } from 'react-redux';
import { map, reduce, throttle, filter, find, flatten, findIndex, concat, some } from 'lodash';
import {
	useUserSettings,
	useBoardConfig,
	useUserAccount,
	useUserAccounts,
	useIntegratedComponent,
	useReplaceHistoryCallback,
	useRemoveCurrentBoard,
	useAddBoardCallback,
	useUpdateCurrentBoard,
	getBridgedFunctions
} from '@zextras/zapp-shell';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import styled from 'styled-components';
import { useQueryParam } from '../../../../hooks/useQueryParam';
import { createEditor, selectEditors, updateEditor } from '../../../../store/editor-slice';
import { ActionsType, ParticipantRole } from '../../../../types/participant';
import { selectMessages } from '../../../../store/messages-slice';
import EditAttachmentsBlock from './edit-attachments-block';
import { saveDraft } from '../../../../store/actions/save-draft';
import { sendMsg } from '../../../../store/actions/send-msg';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { retrieveAttachmentsType } from '../../../../store/editor-slice-utils';
import { uploadAttachments } from '../../../../store/actions/upload-attachments';
import { getMsg } from '../../../../store/actions';
import DropZoneAttachment from './dropzone-attachment';
import { MAIL_APP_ID } from '../../../../constants';

const FileInput = styled.input`
	display: none;
`;

const Divider = styled.div`
	width: 100%;
	min-height: 1px;
	max-height: 1px;
	border-bottom: 1px solid ${({ theme }) => theme.palette.gray2.regular};
`;

const ResizedIconCheckbox = styled(IconCheckbox)`
	[class^='Padding__Comp'] {
		padding: 6px;
		svg {
			height: 20px;
			width: 20px;
		}
	}
`;

const TextArea = styled.textarea`
	box-sizing: border-box;
	padding: ${(props) => props.theme.sizes.padding.large};
	height: fit-content;
	min-height: 150px;
	flex-grow: 1;
	width: 100%;
	border: none;
	resize: none;
	& :focus,
	:active {
		box-shadow: none;
		border: none;
		outline: none;
	}
`;

const EditorWrapper = styled.div`
	width: 100%;
	height: 100%;
	overflow-y: auto;
	position: relative;

	> .tox:not(.tox-tinymce-inline) {
		width: 100%;
		border: none;

		.tox-editor-header {
			padding: ${(props) => props.theme.sizes.padding.large};
			background-color: ${(props) => props.theme.palette.gray6.regular};
		}
		.tox-toolbar__primary {
			background: none;
			background-color: ${(props) => props.theme.palette.gray4.regular};
			border-radius: ${(props) => props.theme.borderRadius};
		}
	}
	> .tox {
		.tox-edit-area {
			margin-left: calc(-1rem + ${(props) => props.theme.sizes.padding.large});
			overflow-y: auto;
			max-height: 100%;
		}
		.tox-edit-area__iframe {
			height: 100%;
			padding-bottom: ${(props) => props.theme.sizes.padding.large};
		}
		&.tox-tinymce {
			height: 100% !important;
		}
	}
`;

const BannerContainer = styled(Container)`
	border-bottom: 1px solid ${(props) => props.theme.palette.info.regular};
	border-top-right-radius: 4px;
	border-top-left-radius: 4px;
	padding: 16px;
`;

let counter = 0;

const generateId = () => {
	counter += 1;
	return `new-${counter}`;
};

export const addAttachments = async (saveDraftCb, uploadAttachmentsCb, compositionData, files) => {
	const { payload } = await saveDraftCb(compositionData);
	const upload = await uploadAttachmentsCb(files);
	const aid = reduce(upload.payload, (acc, v) => [...acc, v.aid], []).join(',');
	const message = normalizeMailMessageFromSoap(payload.resp.m[0]);
	const mp = retrieveAttachmentsType(message, 'attachment');
	const res = await saveDraftCb({
		...compositionData,
		id: payload.resp.m[0].id,
		attach: { aid, mp }
	});
	return retrieveAttachmentsType(normalizeMailMessageFromSoap(res.payload.resp.m[0]), 'attachment');
};

export default function EditView({ mailId, folderId, setHeader, toggleAppBoard }) {
	const settings = useUserSettings();
	const boardContext = useBoardConfig();
	const [editor, setEditor] = useState();
	const [openDD, setOpenDD] = useState(false);
	const [open, setOpen] = useState(false);
	const action = useQueryParam('action');
	const change = useQueryParam('change');

	const editors = useSelector(selectEditors);
	const dispatch = useDispatch();
	const [t] = useTranslation();
	const account = useUserAccount();
	const accounts = useUserAccounts();
	const messages = useSelector(selectMessages);
	const [ContactInput, integrationAvailable] = useIntegratedComponent('contact-input');
	const inputRef = useRef();
	const { handleSubmit, control } = useForm();
	const replaceHistory = useReplaceHistoryCallback();
	const closeBoard = useRemoveCurrentBoard();
	const addBoard = useAddBoardCallback();
	const [dropZoneEnable, setDropZoneEnable] = useState(false);
	const saveDraftCb = useCallback((data) => dispatch(saveDraft({ data })), [dispatch]);
	const [defaultIdentity, setDefaultIdentity] = useState({});
	const [list, setList] = useState([]);
	const [btnSendlabel, setBtnSendLabel] = useState(t('label.send', 'Send'));
	const [btnSendDisabled, setBtnSendDisabled] = useState(false);

	const [isBlocking, setIsBlocking] = useState(false);
	const [isFirstTime, setIsFirstTime] = useState(true);
	const [saveFirstDraft, setSaveFirstDraft] = useState(true);
	const [timer, setTimer] = useState(null);

	const activeMailId = useMemo(
		() => boardContext?.mailId || mailId,
		[mailId, boardContext?.mailId]
	);

	const oldEditorId = useMemo(
		() =>
			find(
				map(Object.keys(editors), (key) => ({ ...editors[key] })),
				{ oldId: activeMailId }
			)?.editorId,
		[activeMailId, editors]
	);

	const editorId = useMemo(() => oldEditorId ?? generateId(), [oldEditorId]);

	const getItems = (items) =>
		items.map((el) => ({
			label: el.label,
			value: el.value,
			address: el.address,
			fullname: el.fullName,
			type: el.type,
			identityName: el.identityName,
			customComponent: (
				<Container
					width="100%"
					takeAvailableSpace
					mainAlignment="space-between"
					orientation="horizontal"
					height="fit"
				>
					<Padding left="small">
						<Text>{el.label}</Text>
					</Padding>
				</Container>
			)
		}));

	const newItems = useMemo(() => getItems(list), [list]);
	const updateEditorCb = useCallback(
		(data) => {
			dispatch(updateEditor({ editorId, data }));
		},
		[dispatch, editorId]
	);
	useEffect(() => {
		const identityList = map(account.identities.identity, (item, idx) => ({
			value: idx,
			label: `${item.name}(${item._attrs?.zimbraPrefFromDisplay}  <${item._attrs?.zimbraPrefFromAddress}>)`,
			address: item._attrs?.zimbraPrefFromAddress,
			fullname: item._attrs?.zimbraPrefFromDisplay,
			type: item._attrs.zimbraPrefFromAddressType,
			identityName: item.name
		}));
		setDefaultIdentity(find(identityList, (item) => item?.identityName === 'DEFAULT'));
		updateEditorCb({
			from: {
				address: defaultIdentity.address,
				fullName: defaultIdentity.fullname,
				name: defaultIdentity.fullname,
				type: ParticipantRole.FROM
			}
		});
		const rightsList = [
			...map(
				filter(
					account?.rights?.targets,
					(rts) => rts.right === 'sendAs' || rts.right === 'sendOnBehalfOf'
				),
				(ele, idx) =>
					map(ele?.target, (item) => ({
						value: idx + identityList.length,
						label:
							ele.right === 'sendAs'
								? `${item.d}<${item.email[0].addr}>`
								: ` ${accounts[0].name} ${t('label.on_behalf_of', 'on behalf of')} ${item.d}<${
										item.email[0].addr
								  }>`,
						address: item.email[0].addr,
						fullname: item.d,
						type: ele.right,
						identityName: ''
					}))
			)
		];

		const flattenList = flatten(rightsList);
		const uniqueIdentityList = [...identityList];
		if (flattenList?.length) {
			map(flattenList, (ele) => {
				const uniqIdentity = findIndex(identityList, { address: ele.address });
				if (uniqIdentity < 0) uniqueIdentityList.push(ele);
			});
			setList(uniqueIdentityList);
		} else setList(identityList);
	}, [account, accounts, defaultIdentity?.address, defaultIdentity?.fullname, t, updateEditorCb]);

	useEffect(() => {
		if (activeMailId) {
			dispatch(getMsg({ msgId: activeMailId }));
		}
	}, [activeMailId, dispatch]);

	useEffect(() => {
		if (!activeMailId) {
			return;
		}
		if (!editors[editorId] && messages[activeMailId] && !oldEditorId) {
			dispatch(
				createEditor({
					settings,
					editorId,
					id: action === ActionsType.EDIT_AS_DRAFT ? activeMailId : undefined,
					original: messages[activeMailId] ?? undefined,
					boardContext,
					action,
					change,
					accounts,
					labels: {
						to: `${t('label.to', 'To')}:`,
						from: `${t('label.from', 'From')}:`,
						cc: `${t('label.cc', 'CC')}:`,
						subject: `${t('label.subject', 'Subject')}:`,
						sent: `${t('label.sent', 'Sent')}:`
					}
				})
			);
		} else {
			setEditor(editors[oldEditorId || editorId]);
		}
	}, [
		folderId,
		dispatch,
		activeMailId,
		messages,
		editors,
		editorId,
		action,
		change,
		accounts,
		t,
		boardContext,
		settings,
		oldEditorId
	]);

	const sendMailCb = useCallback(() => {
		setBtnSendLabel(t('label.sending', 'Sending'));
		setBtnSendDisabled(true);
		if (action === ActionsType.COMPOSE && boardContext?.onConfirm) {
			boardContext?.onConfirm(editor);
		} else {
			let notCanceled = true;
			const infoSnackbar = (remainingTime, hideButton = false) => {
				getBridgedFunctions().createSnackbar({
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
					}
				});
			};

			infoSnackbar(3);
			setTimeout(() => notCanceled && infoSnackbar(2), 1000);
			setTimeout(() => notCanceled && infoSnackbar(1), 2000);
			setTimeout(() => {
				if (notCanceled) {
					folderId ? replaceHistory(`/folder/${folderId}/`) : closeBoard();
					dispatch(sendMsg({ editorId })).then((res) => {
						if (res.type.includes('fulfilled')) {
							getBridgedFunctions().createSnackbar({
								key: `mail-${editorId}`,
								replace: true,
								type: 'success',
								label: t('messages.snackbar.mail_sent', 'Message sent'),
								autoHideTimeout: 3000,
								hideButton: true
							});
						} else {
							getBridgedFunctions().createSnackbar({
								key: `mail-${editorId}`,
								replace: true,
								type: 'error',
								label: t('label.error_try_again', 'Something went wrong, please try again'),
								autoHideTimeout: 3000,
								hideButton: true
							});
							setBtnSendDisabled(false);
						}
					});
				}
			}, 3000);
		}
	}, [action, boardContext, editor, t, dispatch, editorId, folderId, replaceHistory, closeBoard]);

	const autoSaveToDraft = useMemo(
		() => (isBlocking && !isFirstTime) || editor?.attachmentFiles?.length > 0,
		[isBlocking, isFirstTime, editor]
	);

	const saveToDraft = (e) => {
		clearTimeout(timer);
		const newTimer = setTimeout(() => {
			if (autoSaveToDraft && saveFirstDraft) {
				saveDraftCb(editor);
				setSaveFirstDraft(false);
			} else if (editor.id && editor.id !== 'undefined') {
				saveDraftCb(editor);
			}
		}, 500);

		setTimer(newTimer);
	};
	const updateSubjectField = useMemo(
		() =>
			throttle(
				(mod) => {
					updateEditorCb(mod);
				},
				250,
				{
					trailing: true,
					leading: false
				}
			),
		[updateEditorCb]
	);
	const onSave = useCallback(() => {
		saveDraftCb(editor);
		getBridgedFunctions().createSnackbar({
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
	}, [closeBoard, editor, replaceHistory, saveDraftCb, t]);

	const onFileClick = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.value = null;
			inputRef.current.click();
		}
	}, []);

	const toggleOpen = useCallback(() => setOpen((isOpen) => !isOpen), []);

	const uploadAttachmentsCb = useCallback(
		(files) => dispatch(uploadAttachments({ files })),
		[dispatch]
	);

	const attachmentsItems = useMemo(
		() => [
			{
				id: 'localAttachment',
				icon: 'MonitorOutline',
				label: t('composer.attachment.local', 'Add from local'),
				click: onFileClick,
				customComponent: (
					<>
						<Icon icon="MonitorOutline" size="medium" />
						<Padding horizontal="extrasmall" />
						<Text>{t('composer.attachment.local', 'Add from local')}</Text>
					</>
				)
			},
			{
				id: 'driveAttachment',
				icon: 'DriveOutline',
				label: t('composer.attachment.drive', 'Add from Drive'),
				click: () => {
					setOpenDD(false);
				},
				disabled: true
			},
			{
				id: 'contactsModAttachment',
				icon: 'ContactsModOutline',
				label: t('composer.attachment.contacts_mod', 'Add Contact Card'),
				click: () => {
					setOpenDD(false);
				},
				disabled: true
			}
		],
		[onFileClick, t]
	);

	const onClick = () => {
		setOpenDD(!openDD);
	};

	const updateBoard = useUpdateCurrentBoard();

	useEffect(() => {
		if (editor?.cc?.length || editor?.bcc?.length) {
			setOpen(true);
		}
	}, [editor?.bcc?.length, editor?.cc?.length]);

	useEffect(() => {
		if (setHeader) {
			setHeader(editor?.subject ?? t('label.no_subject', 'No subject'));
		} else {
			updateBoard(undefined, editor?.subject ?? t('messages.new_email', 'New e-mail'));
		}
	}, [editor?.subject, setHeader, updateBoard, action, t]);

	useEffect(() => {
		if (!activeMailId) {
			if (!editors[editorId]) {
				dispatch(
					createEditor({
						settings,
						editorId,
						id: action === ActionsType.EDIT_AS_DRAFT ? activeMailId : undefined,
						boardContext,
						original: messages[activeMailId] ?? undefined,
						action,
						change,
						accounts,
						labels: {
							to: `${t('label.to', 'To')}:`,
							from: `${t('label.from', 'From')}:`,
							cc: `${t('label.cc', 'CC')}:`,
							subject: `${t('label.subject', 'Subject')}:`,
							sent: `${t('label.sent', 'Sent')}:`
						}
					})
				);
			} else {
				setEditor(editors[editorId]);
			}
		}
	}, [
		editors,
		editorId,
		dispatch,
		action,
		messages,
		accounts,
		t,
		mailId,
		change,
		boardContext,
		settings,
		activeMailId
	]);

	useEffect(() => {
		if (toggleAppBoard) {
			if (activeMailId) {
				addBoard(`/edit/${activeMailId}?action=${action}`, {
					app: MAIL_APP_ID,
					mailId: activeMailId,
					title: editor?.subject
				});
			} else {
				addBoard(`/new`, {
					app: MAIL_APP_ID
				});
			}
			replaceHistory(`/folder/${folderId}`);
		}
	}, [addBoard, folderId, activeMailId, replaceHistory, toggleAppBoard, action, editor?.subject]);

	const onDragOverEvent = (event) => {
		event.preventDefault();
		setDropZoneEnable(true);
	};

	const onDropEvent = (event) => {
		event.preventDefault();
		setDropZoneEnable(false);
		addAttachments(saveDraftCb, uploadAttachmentsCb, editor, event.dataTransfer.files).then(
			(data) => {
				updateEditorCb({
					attach: { mp: data }
				});
			}
		);
	};

	const onDragLeaveEvent = (event) => {
		event.preventDefault();
		setDropZoneEnable(false);
	};
	const isSendingToYourself = useMemo(
		() => filter(editor?.to, { type: 't', address: accounts[0].name }).length > 0,
		[editor?.to, accounts]
	);

	useEffect(() => {
		if (action === ActionsType.REPLY || action === ActionsType.REPLY_ALL) {
			dispatch(
				updateEditor({
					editorId: editor?.editorId,
					data: {
						attach: { mp: [] },
						attachmentFiles: []
					}
				})
			);
		}
	}, [action, dispatch, editor?.editorId]);

	const isSendDisabled = useMemo(() => {
		const participants = concat(editor?.to, editor?.bcc, editor?.cc);
		return btnSendDisabled || participants.length === 0 || some(participants, { error: true });
	}, [btnSendDisabled, editor]);

	return editor ? (
		<Catcher>
			<Container onDragOver={(event) => onDragOverEvent(event)}>
				<Container
					mainAlignment="flex-start"
					height="100%"
					style={{ position: 'relative', maxHeight: '100%' }}
					background="gray5"
					padding={{ top: 'small', bottom: 'medium', horizontal: 'large' }}
				>
					{dropZoneEnable && (
						<DropZoneAttachment
							onDragOverEvent={onDragOverEvent}
							onDropEvent={onDropEvent}
							onDragLeaveEvent={onDragLeaveEvent}
						/>
					)}
					<Container crossAlignment="unset" height="fit">
						<Row
							padding={{ bottom: 'medium' }}
							orientation="horizontal"
							mainAlignment="flex-end"
							width="100%"
						>
							<Controller
								name="richText"
								control={control}
								defaultValue={editor?.richText ?? false}
								render={({ onChange, value }) => (
									<Tooltip
										label={
											value
												? t('tooltip.disable_rich_text', 'Disable rich text editor')
												: t('tooltip.enable_rich_text', 'Enable rich text editor')
										}
									>
										<ResizedIconCheckbox
											icon="Text"
											value={value}
											onClick={() => {
												updateEditorCb({
													richText: !value
												});
												onChange(!value);
											}}
											onChange={() => null}
										/>
									</Tooltip>
								)}
							/>
							<Controller
								name="urgent"
								control={control}
								defaultValue={editor?.urgent ?? false}
								render={({ onChange, value }) => (
									<Tooltip
										label={
											value
												? t('tooltip.disable_urgent', 'Disable urgent')
												: t('tooltip.enable_urgent', 'Enable urgent')
										}
									>
										<ResizedIconCheckbox
											icon="ArrowUpward"
											value={value}
											onClick={() => {
												updateEditorCb({
													urgent: !value
												});
												onChange(!value);
											}}
											onChange={() => null}
										/>
									</Tooltip>
								)}
							/>
							<Controller
								name="attach"
								control={control}
								defaultValue={editor.attach || {}}
								render={({ onChange, value }) => (
									<FileInput
										type="file"
										ref={inputRef}
										onChange={() =>
											addAttachments(
												saveDraftCb,
												uploadAttachmentsCb,
												editor,
												inputRef.current.files
											).then((data) => {
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
										<ResizedIconCheckbox
											onChange={() => null}
											icon="AttachOutline"
											onClick={onClick}
										/>
									</Dropdown>
								</Tooltip>
							)}
							{action !== ActionsType.COMPOSE && (
								<Padding left="large">
									<Button
										type="outlined"
										onClick={handleSubmit(onSave)}
										label={`${t('label.save', 'Save')}`}
									/>
								</Padding>
							)}
							<Padding left="large">
								<Button onClick={sendMailCb} label={btnSendlabel} disabled={isSendDisabled} />
							</Padding>
						</Row>
						{isSendingToYourself && (
							<>
								<BannerContainer
									orientation="horizontal"
									mainAlignment="flex-start"
									crossAlignment="center"
									background="gray6"
									height="fit"
									padding={{ all: 'large' }}
								>
									<Padding right="large">
										<Icon icon="AlertCircleOutline" color="info" size="large" />
									</Padding>
									<Text>
										{t(
											'message.sending_mail_to_self',
											"It looks like you're about to send an e-mail to yourself"
										)}
									</Text>
								</BannerContainer>
								<Padding bottom="small" />
							</>
						)}

						<Container
							style={{ paddingLeft: '64px', paddingRight: '16px', paddingTop: '16px' }}
							background="gray6"
						>
							{defaultIdentity && list.length ? (
								<Select
									items={newItems}
									label={t('label.from', 'From')}
									defaultSelection={{
										label: defaultIdentity?.label,
										value: defaultIdentity?.value
									}}
									onChange={(val) => {
										const r = find(list, { value: val });
										const data = {
											address: r.address,
											fullName: r.fullname,
											name: r.address,
											type: ParticipantRole.FROM
										};
										updateEditorCb({ from: data });

										if (r.type === 'sendOnBehalfOf') {
											updateEditorCb({
												sender: {
													address: accounts[0].name,
													fullName: accounts[0].displayName,
													name: accounts[0].name,
													type: ParticipantRole.SENDER
												}
											});
										}
									}}
								/>
							) : (
								<></>
							)}
						</Container>
						<Container padding={{ all: 'large' }} background="gray6">
							<Container
								orientation="horizontal"
								width="fill"
								height="fit"
								crossAlignment="flex-start"
								background="gray6"
							>
								<IconButton
									size="large"
									icon={open ? 'ChevronUp' : 'ChevronDown'}
									onClick={toggleOpen}
								/>
								<Container width="calc(100% - 48px)">
									<Container height="fit" width="fill">
										{integrationAvailable ? (
											<Controller
												name="to"
												control={control}
												defaultValue={editor.to ?? []}
												render={({ onChange, value }) => (
													<ContactInput
														placeholder={t('label.to', 'To')}
														onChange={(ev) => {
															const data = map(ev, (r) =>
																r.email
																	? {
																			...r,
																			type: ParticipantRole.TO,
																			address: r.email,
																			name: r.firstName,
																			fullName: r.fullName
																	  }
																	: { ...r, type: ParticipantRole.TO }
															);
															updateEditorCb({ to: data });
															onChange(data);
														}}
														defaultValue={value}
													/>
												)}
											/>
										) : (
											<Controller
												name="to"
												control={control}
												defaultValue={editor.to ?? []}
												render={({ onChange, value }) => (
													<ChipInput
														placeholder={t('label.to', 'To')}
														onChange={(ev) => {
															const data = map(ev, (r) =>
																r.email
																	? {
																			type: ParticipantRole.TO,
																			address: r.email,
																			name: r.firstName,
																			fullName: r.fullName
																	  }
																	: {
																			...r,
																			email: r.label,
																			address: r.label,
																			type: ParticipantRole.TO
																	  }
															);
															updateEditorCb({ to: data });
															onChange(data);
														}}
														defaultValue={map(value, (v) => ({ ...v, label: v.name }))}
														background="gray5"
													/>
												)}
											/>
										)}
									</Container>
									<Divider />
									<Collapse orientation="vertical" crossSize="100%" open={open}>
										<Container height="fit">
											{integrationAvailable ? (
												<Controller
													name="cc"
													control={control}
													defaultValue={editor.cc ?? []}
													render={({ onChange, value }) => (
														<ContactInput
															placeholder={t('label.cc', 'CC')}
															onChange={(ev) => {
																const data = map(ev, (r) =>
																	r.email
																		? {
																				type: ParticipantRole.CARBON_COPY,
																				address: r.email,
																				name: r.firstName,
																				fullName: r.fullName
																		  }
																		: { ...r, type: ParticipantRole.CARBON_COPY }
																);
																updateEditorCb({ cc: data });
																onChange(data);
															}}
															defaultValue={value}
														/>
													)}
												/>
											) : (
												<Controller
													name="cc"
													control={control}
													defaultValue={editor.cc ?? []}
													render={({ onChange, value }) => (
														<ChipInput
															placeholderType="inline"
															placeholder={t('label.cc', 'CC')}
															onChange={(ev) => {
																const data = map(ev, (r) =>
																	r.email
																		? {
																				type: ParticipantRole.CARBON_COPY,
																				address: r.email,
																				name: r.firstName,
																				fullName: r.fullName
																		  }
																		: {
																				...r,
																				email: r.label,
																				address: r.label,
																				type: ParticipantRole.CARBON_COPY
																		  }
																);
																updateEditorCb({ cc: data });
																onChange(data);
															}}
															defaultValue={map(value, (v) => ({
																...v,
																label: v.name,
																type: ParticipantRole.CARBON_COPY
															}))}
															background="gray5"
														/>
													)}
												/>
											)}
										</Container>
										<Divider />
										<Container height="fit">
											{integrationAvailable ? (
												<Controller
													name="bcc"
													control={control}
													defaultValue={editor.bcc ?? []}
													render={({ onChange, value }) => (
														<ContactInput
															placeholder={t('label.bcc', 'BCC')}
															onChange={(ev) => {
																const data = map(ev, (r) =>
																	r.email
																		? {
																				type: ParticipantRole.BLIND_CARBON_COPY,
																				address: r.email,
																				name: r.firstName,
																				fullName: r.fullName
																		  }
																		: // prettier-ignore
																		  // eslint-disable-next-line max-len
																		  { ...r, type: ParticipantRole.BLIND_CARBON_COPY }
																);
																updateEditorCb({ bcc: data });
																onChange(data);
															}}
															defaultValue={value}
														/>
													)}
												/>
											) : (
												<Controller
													name="bcc"
													control={control}
													defaultValue={editor.bcc ?? []}
													render={({ onChange, value }) => (
														<ChipInput
															placeholderType="inline"
															placeholder={t('label.bcc', 'BCC')}
															onChange={(ev) => {
																const data = map(ev, (r) =>
																	r.email
																		? {
																				type: ParticipantRole.BLIND_CARBON_COPY,
																				address: r.email,
																				name: r.firstName,
																				fullName: r.fullName
																		  }
																		: {
																				...r,
																				email: r.label,
																				address: r.label,
																				type: ParticipantRole.BLIND_CARBON_COPY
																		  }
																);
																updateEditorCb({ bcc: data });
																onChange(data);
															}}
															background="gray5"
															defaultValue={map(value, (v) => ({ ...v, label: v.name }))}
														/>
													)}
												/>
											)}
										</Container>
										<Divider />
									</Collapse>
								</Container>
							</Container>
						</Container>
						<Container
							style={{ paddingLeft: '64px', paddingRight: '16px' }}
							background="gray6"
							width="fill"
						>
							<Controller
								name="subject"
								control={control}
								defaultValue={editor?.subject ?? ''}
								render={({ onChange, value }) => (
									<Container background="gray5">
										<EmailComposerInput
											onChange={(ev) => {
												updateSubjectField({ subject: ev.target.value });
												onChange(ev.target.value);
											}}
											placeholder={t('label.subject', 'Subject')}
											placeholderType="default"
											value={value}
										/>
									</Container>
								)}
							/>
							<Divider />
						</Container>
						{editor.original && editor.attach?.mp?.length > 0 && action !== ActionsType.COMPOSE && (
							<>
								<Container width="fill" background="gray6" padding={{ top: 'large' }}>
									<Row width="fill">
										<EditAttachmentsBlock editor={editor} />
									</Row>
								</Container>
							</>
						)}
					</Container>
					{editor?.richText ? (
						<Controller
							name="text"
							control={control}
							defaultValue={editor?.text}
							render={({ onChange, value }) => (
								<Container background="gray6">
									<EditorWrapper>
										<RichTextEditor
											value={value[1]}
											onEditorChange={(ev) => {
												updateSubjectField({ text: [ev[0], ev[1]] });
												saveToDraft();

												onChange([ev[0], ev[1]]);
												if (!isFirstTime) setIsBlocking(true);
												setIsFirstTime(false);
											}}
											minHeight={150}
											onDragOver={onDragOverEvent}
										/>
									</EditorWrapper>
								</Container>
							)}
						/>
					) : (
						<Controller
							name="text"
							control={control}
							defaultValue={editor?.text}
							render={({ onChange, value }) => (
								<Container background="gray6">
									<TextArea
										value={value[0]}
										onChange={(ev) => {
											// eslint-disable-next-line no-param-reassign
											ev.target.style.height = 'auto';
											// eslint-disable-next-line no-param-reassign
											ev.target.style.height = `${25 + ev.target.scrollHeight}px`;
											const data = [
												ev.target.value,
												`${
													editor?.text[1] ? `${editor.text[1]}${ev.target.value}` : ev.target.value
												}`
											];
											updateSubjectField({ text: data });
											onChange(data);
										}}
									/>
								</Container>
							)}
						/>
					)}
					<Divider />
				</Container>
			</Container>
		</Catcher>
	) : (
		<Container height="50%" mainAlignment="center" crossAlignment="center">
			<Button loading disabled label="" type="ghost" />
		</Container>
	);
}
