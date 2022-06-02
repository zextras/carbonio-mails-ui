/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
	Button,
	Catcher,
	ChipInput,
	Container,
	Dropdown,
	EmailComposerInput,
	Icon,
	IconCheckbox,
	Padding,
	Row,
	SnackbarManagerContext,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useDispatch, useSelector } from 'react-redux';
import {
	map,
	reduce,
	throttle,
	filter,
	find,
	flatten,
	findIndex,
	concat,
	some,
	isNil,
	compact
} from 'lodash';
import {
	useUserSettings,
	useBoardConfig,
	useUserAccount,
	useUserAccounts,
	replaceHistory,
	useIntegratedComponent,
	useRemoveCurrentBoard,
	useAddBoardCallback,
	useUpdateCurrentBoard,
	getBridgedFunctions,
	getAction,
	useIntegratedFunction
} from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import styled from 'styled-components';
import moment from 'moment';
import { useQueryParam } from '../../../../hooks/useQueryParam';
import {
	closeEditor,
	createEditor,
	selectEditors,
	updateEditor
} from '../../../../store/editor-slice';
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
import { MAILS_ROUTE, MAIL_APP_ID } from '../../../../constants';

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
	min-height: 250px;

	flex-grow: 1;
	width: 100%;
	border: none;
	resize: vertical;
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
		.tox-editor-container {
			min-height: 300px;
		}
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

const RowContainer = styled(Container)`
	display: grid;
	grid-template-columns: repeat(12, 1fr);
	grid-gap: 8px;
`;

const ColContainer = styled.div`
	grid-column: ${({ occupyFull }) => `span  ${occupyFull ? 12 : 6}`};
`;

const StickyTime = styled(Row)`
	position: sticky;
	bottom: 10px;
`;
let counter = 0;

const generateId = () => {
	counter += 1;
	return `new-${counter}`;
};
const emailRegex =
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, max-len, no-control-regex
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

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

const uploadToFiles = async (node, uploadTo) =>
	uploadTo({ nodeId: node.id, targetModule: 'MAILS' });

export default function EditView({ mailId, folderId, setHeader, toggleAppBoard }) {
	const settings = useUserSettings();
	const boardContext = useBoardConfig();
	const [editor, setEditor] = useState();
	const [openDD, setOpenDD] = useState(false);

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
	const closeBoard = useRemoveCurrentBoard();
	const addBoard = useAddBoardCallback();
	const [dropZoneEnable, setDropZoneEnable] = useState(false);
	const saveDraftCb = useCallback((data) => dispatch(saveDraft({ data })), [dispatch]);
	const [defaultIdentity, setDefaultIdentity] = useState({});
	const [list, setList] = useState([]);
	const [btnSendlabel, setBtnSendLabel] = useState(t('label.send', 'Send'));
	const [btnSendDisabled, setBtnSendDisabled] = useState(false);
	const createSnackbar = useContext(SnackbarManagerContext);

	const [saveFirstDraft, setSaveFirstDraft] = useState(true);
	const [draftSavedAt, setDraftSavedAt] = useState('');
	const [timer, setTimer] = useState(null);
	const [open, setOpen] = useState(false);
	const [showCc, setShowCc] = useState(false);
	const [showBcc, setShowBcc] = useState(false);
	const [loading, setLoading] = useState(false);
	const [initialAction, setInitialAction] = useState(action);
	const [actionChanged, setActionChanged] = useState(true);
	const [isUploading, setIsUploading] = useState(false);

	const [from, setFrom] = useState({
		label: defaultIdentity?.label,
		value: defaultIdentity?.value
	});
	const activeMailId = useMemo(
		() => boardContext?.mailId || mailId,
		[mailId, boardContext?.mailId]
	);

	const editorId = useMemo(() => activeMailId ?? generateId(), [activeMailId]);

	useEffect(() => {
		if (actionChanged && editors[editorId]) {
			dispatch(closeEditor(editorId));
		}
	}, [actionChanged, dispatch, editorId, editors]);

	const toggleOpen = useCallback(() => setOpen((show) => !show), []);
	const toggleCc = useCallback(() => setShowCc((show) => !show), []);
	const toggleBcc = useCallback(() => setShowBcc((show) => !show), []);
	const updateEditorCb = useCallback(
		(data) => {
			dispatch(updateEditor({ editorId, data }));
		},
		[dispatch, editorId]
	);
	const [activeFrom, setActiveFrom] = useState(list[0]);
	const noName = useMemo(() => t('label.no_name', '<No Name>'), [t]);
	const newItems = useMemo(
		() =>
			list.map((el) => ({
				label: el.label,
				value: el.value,
				address: el.address,
				fullname: el.fullName,
				type: el.type,
				identityName: el.identityName,

				onClick: () => {
					setActiveFrom(el);
					const data = {
						address: el.address,
						fullName: el.fullname,
						name: el.address,
						type: ParticipantRole.FROM
					};

					updateEditorCb({ from: data });

					if (el.type === 'sendOnBehalfOf') {
						updateEditorCb({
							sender: {
								address: accounts[0].name,
								fullName: accounts[0].displayName,
								name: accounts[0].name,
								type: ParticipantRole.SENDER
							}
						});
					}
					setFrom(data);
					setOpen(false);
				},
				selected: el === activeFrom,
				customComponent: (
					<Container width="100%" crossAlignment="flex-start" height="fit">
						<Text weight="bold">{el.identityName || noName}</Text>
						{el.type === 'sendOnBehalfOf' ? (
							<Text color="gray1"> {el.label} </Text>
						) : (
							<Text color="gray1">{`${el.fullname} <${el.address}>`}</Text>
						)}
					</Container>
				)
			})),

		[accounts, activeFrom, list, updateEditorCb, noName]
	);

	useEffect(() => {
		const identityList = map(account.identities.identity, (item, idx) => ({
			value: idx,
			label: `${item.name ?? ''}(${item._attrs?.zimbraPrefFromDisplay ?? ''}  <${
				item._attrs?.zimbraPrefFromAddress
			}>)`,
			address: item._attrs?.zimbraPrefFromAddress,
			fullname: item._attrs?.zimbraPrefFromDisplay ?? '',
			type: item._attrs.zimbraPrefFromAddressType,
			identityName: item.name ?? ''
		}));
		setDefaultIdentity(find(identityList, (item) => item?.identityName === 'DEFAULT'));
		setFrom({
			address: find(identityList, (item) => item?.identityName === 'DEFAULT')?.address,
			fullName: find(identityList, (item) => item?.identityName === 'DEFAULT')?.fullname,
			name: find(identityList, (item) => item?.identityName === 'DEFAULT')?.address,
			type: ParticipantRole.FROM
		});
		setActiveFrom(find(identityList, (item) => item?.identityName === 'DEFAULT'));
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
		if (activeMailId && !messages?.[activeMailId]?.isComplete) {
			dispatch(getMsg({ msgId: activeMailId }));
		}
	}, [activeMailId, dispatch, messages, updateEditorCb]);

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
	}, [action, boardContext, editor, t, dispatch, editorId, folderId, closeBoard]);

	const throttledSaveToDraft = useCallback(
		(data) => {
			clearTimeout(timer);
			const newTimer = setTimeout(() => {
				const newData = { ...editor, ...data };
				if (saveFirstDraft) {
					saveDraftCb(newData);
					setDraftSavedAt(moment().format('HH:mm'));
					setSaveFirstDraft(false);
				} else if (!isNil(editor.id)) {
					saveDraftCb(newData);
					setDraftSavedAt(moment().format('HH:mm'));
				}
			}, 500);

			setTimer(newTimer);
		},
		[editor, saveDraftCb, saveFirstDraft, timer]
	);

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
	}, [closeBoard, editor, saveDraftCb, t]);

	const onFileClick = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.value = null;
			inputRef.current.click();
		}
	}, []);

	const uploadAttachmentsCb = useCallback(
		(files) => dispatch(uploadAttachments({ files })),
		[dispatch]
	);
	const [uploadTo, functionCheck] = useIntegratedFunction('upload-to-target-and-get-target-id');

	const confirmAction = useCallback(
		(nodes) => {
			const promises = map(nodes, (node) => uploadToFiles(node, uploadTo));
			if (functionCheck) {
				Promise.allSettled(promises).then((res) => {
					const success = filter(res, ['status', 'fulfilled']);
					const allSuccess = res.length === success?.length;
					const allFails = res.length === filter(res, ['status', 'rejected'])?.length;
					const type = allSuccess ? 'info' : 'warning';
					// eslint-disable-next-line no-nested-ternary
					const label = allSuccess
						? t('message.snackbar.all_att_added', 'Attachments added successfully')
						: allFails
						? t(
								'message.snackbar.att_err_adding',
								'There seems to be a problem when adding attachments, please try again'
						  )
						: t(
								'message.snackbar.some_att_add_fails',
								'There seems to be a problem when adding some attachments, please try again'
						  );
					createSnackbar({
						key: `calendar-moved-root`,
						replace: true,
						type,
						hideButton: true,
						label,
						autoHideTimeout: 4000
					});
					const data = {
						attach: { ...editor.attach, aid: map(success, (i) => i.value.attachmentId).join(',') }
					};
					const newEditor = { ...editor, ...data };
					updateEditorCb(newEditor);
					saveDraftCb(newEditor);
				});
			}
		},
		[createSnackbar, editor, functionCheck, saveDraftCb, t, updateEditorCb, uploadTo]
	);

	const actionTarget = useMemo(
		() => ({
			confirmAction,
			confirmLabel: t('label.select', 'Select'),
			allowFiles: true,
			allowFolders: false
		}),
		[confirmAction, t]
	);

	const [filesSelectFilesAction, filesSelectFilesActionAvailable] = getAction(
		'carbonio_files_action',
		'files-select-nodes',
		actionTarget
	);

	const attachmentsItems = useMemo(() => {
		const localItem = {
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
		};
		const contactItem = {
			id: 'contactsModAttachment',
			icon: 'ContactsModOutline',
			label: t('composer.attachment.contacts_mod', 'Add Contact Card'),
			click: () => {
				setOpenDD(false);
			},
			disabled: true
		};
		const driveItem = filesSelectFilesActionAvailable
			? {
					...filesSelectFilesAction,
					label: t('composer.attachment.files', 'Add from Files')
			  }
			: undefined;

		return compact([localItem, driveItem, contactItem]);
	}, [filesSelectFilesAction, filesSelectFilesActionAvailable, onFileClick, t]);

	const onClick = () => {
		setOpenDD(!openDD);
	};

	const updateBoard = useUpdateCurrentBoard();

	useEffect(() => {
		if (editor?.cc?.length) {
			setShowCc(true);
		}
		if (editor?.bcc?.length) {
			setShowBcc(true);
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
		if (action !== initialAction) {
			setActionChanged(true);
			setInitialAction(action);
		}
	}, [action, initialAction]);

	useEffect(() => {
		if (editors[editorId] && actionChanged) {
			setActionChanged(false);
		}
	}, [actionChanged, editorId, editors]);

	useEffect(() => {
		if (
			(activeMailId && messages?.[activeMailId]?.isComplete) ||
			action === ActionsType.NEW ||
			action === ActionsType.PREFILL_COMPOSE ||
			action === ActionsType.COMPOSE ||
			action === ActionsType.MAIL_TO ||
			actionChanged
		) {
			if (!editors[editorId] || actionChanged) {
				setLoading(true);
				dispatch(
					createEditor({
						settings,
						editorId,
						id: action === ActionsType.EDIT_AS_DRAFT ? activeMailId : undefined,
						original: messages?.[activeMailId ?? editorId],
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
				setTimeout(() => {
					setLoading(false);
				}, 10);
			} else {
				setEditor(editors[editorId]);
			}
		}
	}, [
		accounts,
		action,
		actionChanged,
		activeMailId,
		boardContext,
		change,
		dispatch,
		editor,
		editorId,
		editors,
		messages,
		saveDraftCb,
		settings,
		t
	]);

	useEffect(() => {
		if (editor) {
			if (
				action === ActionsType.PREFILL_COMPOSE &&
				!isUploading &&
				editor?.attach?.aid &&
				!saveFirstDraft
			) {
				setIsUploading(true);
				throttledSaveToDraft(editor);
				setTimeout(() => {
					setIsUploading(false);
				}, 10);
			}
		}
	}, [action, editor, isUploading, saveFirstDraft, throttledSaveToDraft]);

	useEffect(() => {
		if (toggleAppBoard) {
			if (activeMailId) {
				addBoard(`${MAILS_ROUTE}/edit/${activeMailId}?action=${action}`, {
					app: MAIL_APP_ID,
					mailId: activeMailId,
					title: editor?.subject
				});
			} else {
				addBoard(`${MAILS_ROUTE}/new`, {
					app: MAIL_APP_ID,
					title: t('label.new_email', 'New E-mail')
				});
			}
			replaceHistory(`/folder/${folderId}`);
		}
	}, [addBoard, folderId, activeMailId, toggleAppBoard, action, editor?.subject, t]);

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

	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');

	const haveIdentity = useMemo(() => defaultIdentity && list.length > 1, [defaultIdentity, list]);

	if (loading || !editor)
		return (
			<Container height="50%" mainAlignment="center" crossAlignment="center">
				<Button loading disabled label="" type="ghost" />
			</Container>
		);
	return (
		<Catcher>
			<Container onDragOver={(event) => onDragOverEvent(event)}>
				<Container
					mainAlignment="flex-start"
					height="fill"
					style={{ position: 'relative', maxHeight: '100%', overflowY: 'auto' }}
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
					<Container crossAlignment="flex-end" height="fit" background="gray6">
						<Row
							padding={{ all: 'small' }}
							orientation="horizontal"
							mainAlignment={haveIdentity ? 'space-between' : 'flex-end'}
							width="100%"
						>
							{haveIdentity && (
								<Row>
									<Tooltip label={activeFrom.label} maxWidth="100%" placement="top-start">
										<Dropdown
											items={newItems}
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

						<RowContainer background="gray6" padding={{ all: 'small' }}>
							<ColContainer occupyFull>
								{integrationAvailable ? (
									<Controller
										name="to"
										control={control}
										defaultValue={editor.to ?? []}
										render={({ onChange, value }) => (
											<Container
												orientation="horizontal"
												background="gray5"
												style={{ overflow: 'hidden' }}
												padding={{ all: 'none' }}
											>
												<Container background="gray5" style={{ overflow: 'hidden' }}>
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
															throttledSaveToDraft({ to: data });
														}}
														defaultValue={value}
														bottomBorderColor="transparent"
														hasError={some(editor?.to || [], { error: true })}
														errorLabel=""
														wrap="wrap"
													/>
												</Container>
												<Container
													width="fit"
													background="gray5"
													padding={{ right: 'medium', left: 'extrasmall' }}
													orientation="horizontal"
												>
													<Button
														label={t('label.cc', 'Cc')}
														type="ghost"
														style={{ color: '#282828', padding: 0 }}
														onClick={toggleCc}
													/>
													<Button
														label={t('label.bcc', 'Bcc')}
														type="ghost"
														style={{ color: '#282828', padding: 0 }}
														onClick={toggleBcc}
													/>
												</Container>
											</Container>
										)}
									/>
								) : (
									<Controller
										name="to"
										control={control}
										defaultValue={editor.to ?? []}
										render={({ onChange, value }) => (
											<Container orientation="horizontal" background="gray5">
												<Container background="gray5">
													<ChipInput
														placeholder={t('label.to', 'To')}
														onChange={(ev) => {
															const data = map(ev, (r) =>
																r.email
																	? {
																			type: ParticipantRole.TO,
																			address: r.email,
																			name: r.firstName,
																			fullName: r.fullName,
																			error: !emailRegex.test(r.email)
																	  }
																	: {
																			...r,
																			email: r.label,
																			address: r.label,
																			type: ParticipantRole.TO,
																			error: !emailRegex.test(r.email)
																	  }
															);
															updateEditorCb({ to: data });
															onChange(data);
															throttledSaveToDraft({ to: data });
														}}
														defaultValue={map(value, (v) => ({ ...v, label: v.name }))}
														background="gray5"
														hasError={some(editor?.to || [], { error: true })}
														errorLabel=""
													/>
												</Container>
												<Container
													width="fit"
													background="gray5"
													padding={{ right: 'medium', left: 'extrasmall' }}
													orientation="horizontal"
												>
													<Button
														label={t('label.cc', 'Cc')}
														type="ghost"
														style={{ color: '#282828', padding: 0 }}
														onClick={toggleCc}
													/>
													<Button
														label={t('label.bcc', 'Bcc')}
														type="ghost"
														style={{ color: '#282828', padding: 0 }}
														onClick={toggleBcc}
													/>
												</Container>
											</Container>
										)}
									/>
								)}
							</ColContainer>

							{showCc && (
								<ColContainer height="fit" occupyFull>
									{integrationAvailable ? (
										<Controller
											name="cc"
											control={control}
											defaultValue={editor.cc ?? []}
											render={({ onChange, value }) => (
												<ContactInput
													placeholder={t('label.cc', 'Cc')}
													onChange={(ev) => {
														const data = map(ev, (r) =>
															r.email
																? {
																		...r,
																		type: ParticipantRole.CARBON_COPY,
																		address: r.email,
																		name: r.firstName,
																		fullName: r.fullName
																  }
																: { ...r, type: ParticipantRole.CARBON_COPY }
														);
														updateEditorCb({ cc: data });
														onChange(data);
														throttledSaveToDraft({ cc: data });
													}}
													defaultValue={value}
													errorLabel=""
													hasError={some(editor?.cc || [], { error: true })}
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
													placeholder={t('label.cc', 'Cc')}
													onChange={(ev) => {
														const data = map(ev, (r) =>
															r.email
																? {
																		...r,
																		type: ParticipantRole.CARBON_COPY,
																		address: r.email,
																		name: r.firstName,
																		fullName: r.fullName,
																		error: !emailRegex.test(r.email)
																  }
																: {
																		...r,
																		email: r.label,
																		address: r.label,
																		type: ParticipantRole.CARBON_COPY,
																		error: !emailRegex.test(r.email)
																  }
														);
														updateEditorCb({ cc: data });
														onChange(data);
														throttledSaveToDraft({ cc: data });
													}}
													defaultValue={map(value, (v) => ({
														...v,
														label: v.name,
														type: ParticipantRole.CARBON_COPY
													}))}
													background="gray5"
													errorLabel=""
													hasError={some(editor?.cc || [], { error: true })}
												/>
											)}
										/>
									)}
								</ColContainer>
							)}
							{showBcc && (
								<ColContainer occupyFull>
									{integrationAvailable ? (
										<Controller
											name="bcc"
											control={control}
											defaultValue={editor.bcc ?? []}
											render={({ onChange, value }) => (
												<ContactInput
													placeholder={t('label.bcc', 'Bcc')}
													onChange={(ev) => {
														const data = map(ev, (r) =>
															r.email
																? {
																		...r,
																		type: ParticipantRole.BLIND_CARBON_COPY,
																		address: r.email,
																		name: r.firstName,
																		fullName: r.fullName
																  }
																: { ...r, type: ParticipantRole.BLIND_CARBON_COPY }
														);
														updateEditorCb({ bcc: data });
														onChange(data);
														throttledSaveToDraft({ bcc: data });
													}}
													errorLabel=""
													hasError={some(editor?.bcc || [], { error: true })}
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
													placeholder={t('label.bcc', 'Bcc')}
													onChange={(ev) => {
														const data = map(ev, (r) =>
															r.email
																? {
																		...r,
																		type: ParticipantRole.BLIND_CARBON_COPY,
																		address: r.email,
																		name: r.firstName,
																		fullName: r.fullName,
																		error: !emailRegex.test(r.email)
																  }
																: {
																		...r,
																		email: r.label,
																		address: r.label,
																		type: ParticipantRole.BLIND_CARBON_COPY,
																		error: !emailRegex.test(r.email)
																  }
														);
														updateEditorCb({ bcc: data });
														onChange(data);
														throttledSaveToDraft({ bcc: data });
													}}
													background="gray5"
													defaultValue={map(value, (v) => ({ ...v, label: v.name }))}
													errorLabel=""
													hasError={some(editor?.bcc || [], { error: true })}
												/>
											)}
										/>
									)}
								</ColContainer>
							)}

							<ColContainer occupyFull>
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
													throttledSaveToDraft({ subject: ev.target.value });
												}}
												placeholder={t('label.subject', 'Subject')}
												placeholderType="default"
												value={value}
											/>
										</Container>
									)}
								/>
							</ColContainer>

							{editor.original && editor.attach?.mp?.length > 0 && action !== ActionsType.COMPOSE && (
								<ColContainer occupyFull>
									<EditAttachmentsBlock
										editor={editor}
										throttledSaveToDraft={throttledSaveToDraft}
									/>
								</ColContainer>
							)}
						</RowContainer>
					</Container>
					{editor?.text && (
						<Container
							height="100%"
							padding={{ all: 'small' }}
							background="gray6"
							crossAlignment="flex-end"
						>
							{editor?.richText && composerIsAvailable ? (
								<Controller
									name="text"
									control={control}
									defaultValue={editor?.text}
									render={({ onChange, value }) => (
										<Container background="gray6">
											<EditorWrapper>
												<Composer
													value={value[1]}
													onEditorChange={(ev) => {
														updateSubjectField({ text: [ev[0], ev[1]] });
														throttledSaveToDraft({ text: [ev[0], ev[1]] });
														onChange([ev[0], ev[1]]);
													}}
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
										<Container background="gray6" height="100%">
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
															editor?.text[1]
																? `${editor.text[1]}${ev.target.value}`
																: ev.target.value
														}`
													];

													throttledSaveToDraft({ text: data });

													updateSubjectField({ text: data });
													onChange(data);
												}}
											/>
										</Container>
									)}
								/>
							)}

							{draftSavedAt && (
								<StickyTime>
									<Row
										crossAlignment="flex-end"
										background="gray5"
										padding={{ vertical: 'medium', horizontal: 'large' }}
									>
										<Text size="extrasmall" color="secondary">
											{t('message.email_saved_at', {
												time: draftSavedAt,
												defaultValue: 'Email saved as draft at {{time}}'
											})}
										</Text>
									</Row>
								</StickyTime>
							)}
							<Divider />
						</Container>
					)}
				</Container>
			</Container>
		</Catcher>
	);
}
