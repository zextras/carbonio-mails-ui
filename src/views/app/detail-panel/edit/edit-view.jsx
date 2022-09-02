/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, {
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
	useRef
} from 'react';
import {
	Button,
	Catcher,
	Container,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import { useDispatch, useSelector } from 'react-redux';
import { throttle, filter, isNil } from 'lodash';
import {
	useUserSettings,
	useBoardHooks,
	useUserAccounts,
	replaceHistory,
	addBoard,
	useBoard,
	FOLDERS
} from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';

import moment from 'moment';
import { useQueryParam } from '../../../../hooks/useQueryParam';
import {
	closeEditor,
	createEditor,
	selectEditors,
	updateEditor
} from '../../../../store/editor-slice';
import { ActionsType } from '../../../../commons/utils';
import { selectMessages } from '../../../../store/messages-slice';
import EditAttachmentsBlock from './edit-attachments-block';
import { saveDraft } from '../../../../store/actions/save-draft';
import { uploadAttachments } from '../../../../store/actions/upload-attachments';
import { getMsg } from '../../../../store/actions';
import DropZoneAttachment from './dropzone-attachment';
import { MAILS_ROUTE } from '../../../../constants';

import { addAttachments } from './edit-utils';
import { RouteLeavingGuard } from './parts/nav-guard';
import * as StyledComp from './parts/edit-view-styled-components';
import { EditViewContext } from './parts/edit-view-context';
import ParticipantsRow from './parts/participants-row';
import TextEditorContainer from './parts/text-editor-container';
import EditViewHeader from './parts/edit-view-header';
import WarningBanner from './parts/warning-banner';
import SubjectRow from './parts/subject-row';
import { moveMsgToTrash } from '../../../../ui-actions/message-actions';

let counter = 0;

const generateId = () => {
	counter += 1;
	return `new-${counter}`;
};

export default function EditView({ mailId, folderId, setHeader, toggleAppBoard }) {
	const settings = useUserSettings();
	const boardUtilities = useBoardHooks();
	const board = useBoard();
	const createSnackbar = useContext(SnackbarManagerContext);
	const [editor, setEditor] = useState();

	const action = useQueryParam('action');
	const change = useQueryParam('change');

	const editors = useSelector(selectEditors);
	const dispatch = useDispatch();
	const [t] = useTranslation();

	const accounts = useUserAccounts();
	const messages = useSelector(selectMessages);

	const { handleSubmit, control, setValue } = useForm();
	const { prefs } = useUserSettings();
	const [dropZoneEnable, setDropZoneEnable] = useState(false);
	const saveDraftCb = useCallback(
		(data) => dispatch(saveDraft({ data, prefs })),
		[dispatch, prefs]
	);

	const [saveFirstDraft, setSaveFirstDraft] = useState(true);
	const [draftSavedAt, setDraftSavedAt] = useState('');
	const [timer, setTimer] = useState(null);

	const [loading, setLoading] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	const containerRef = useRef();
	const textEditorRef = useRef();

	const [avaibleMinHeight, setAvaibleMinHeight] = useState(0);

	useLayoutEffect(() => {
		const calculateAvaibleMinHeight = () => {
			const containerHeight = containerRef?.current?.clientHeight;
			setAvaibleMinHeight(containerHeight ? containerHeight - 235 : 0);
		};
		calculateAvaibleMinHeight();
		window.addEventListener('resize', calculateAvaibleMinHeight);
		return () => window.removeEventListener('resize', calculateAvaibleMinHeight);
	}, [containerRef?.current?.clientHeight, textEditorRef?.current?.clientHeight]);
	const [showRouteGuard, setShowRouteGuard] = useState(true);

	const activeMailId = useMemo(
		() => board?.context?.mailId || mailId,
		[mailId, board?.context?.mailId]
	);

	const editorId = useMemo(() => activeMailId ?? generateId(), [activeMailId]);

	const isSameAction = useMemo(() => {
		if (editors[editorId]) {
			return editors[editorId].action === action;
		}
		return undefined;
	}, [action, editorId, editors]);

	useEffect(() => {
		if (!isSameAction && editors[editorId]) {
			dispatch(closeEditor(editorId));
		}
	}, [isSameAction, dispatch, editorId, editors]);

	const updateEditorCb = useCallback(
		(data) => {
			dispatch(updateEditor({ editorId, data }));
		},
		[dispatch, editorId]
	);

	useEffect(() => {
		if (activeMailId && !messages?.[activeMailId]?.isComplete) {
			dispatch(getMsg({ msgId: activeMailId }));
		}
	}, [activeMailId, dispatch, messages, updateEditorCb]);

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

	const uploadAttachmentsCb = useCallback(
		(files) => dispatch(uploadAttachments({ files })),
		[dispatch]
	);

	useEffect(() => {
		if (setHeader) {
			setHeader(editor?.subject ?? t('label.no_subject', 'No subject'));
		} else {
			boardUtilities?.updateBoard({
				title: editor?.subject?.length > 0 ? editor?.subject : t('messages.new_email', 'New e-mail')
			});
		}
	}, [editor?.subject, setHeader, action, t, boardUtilities]);

	useEffect(() => {
		if (
			(activeMailId && messages?.[activeMailId]?.isComplete) ||
			action === ActionsType.NEW ||
			action === ActionsType.PREFILL_COMPOSE ||
			action === ActionsType.COMPOSE ||
			action === ActionsType.MAIL_TO
		) {
			if (!editors[editorId] || isSameAction === false) {
				setLoading(true);
				dispatch(
					createEditor({
						settings,
						editorId,
						id: action === ActionsType.EDIT_AS_DRAFT ? activeMailId : undefined,
						original: messages?.[activeMailId ?? editorId],
						boardContext: board?.context,
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
		isSameAction,
		activeMailId,
		board?.context,
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
				addBoard({
					url: `${MAILS_ROUTE}/edit/${activeMailId}?action=${action}`,
					context: { mailId: activeMailId },
					title: editor?.subject
				});
			} else {
				addBoard({ url: `${MAILS_ROUTE}/new`, title: t('label.new_email', 'New E-mail') });
			}
			replaceHistory(`/folder/${folderId}`);
		}
	}, [folderId, activeMailId, toggleAppBoard, action, editor?.subject, t]);

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

	const showAttachments = useMemo(
		() => editor?.original && editor?.attach?.mp?.length > 0 && action !== ActionsType.COMPOSE,
		[action, editor?.attach?.mp?.length, editor?.original]
	);

	const context = useMemo(
		() => ({
			updateEditorCb,
			throttledSaveToDraft,
			control,
			editorId,
			editor,
			updateSubjectField,
			action,
			folderId,
			saveDraftCb
		}),
		[
			action,
			control,
			editor,
			editorId,
			folderId,

			saveDraftCb,
			throttledSaveToDraft,
			updateEditorCb,
			updateSubjectField
		]
	);

	if (loading || !editor)
		return (
			<Container height="50%" mainAlignment="center" crossAlignment="center">
				<Button loading disabled label="" type="ghost" />
			</Container>
		);
	return (
		<>
			<RouteLeavingGuard
				when={showRouteGuard && !toggleAppBoard}
				onDeleteDraft={() => {
					moveMsgToTrash({
						ids: [editor.id],
						t,
						dispatch,
						createSnackbar,
						folderId: FOLDERS.TRASH
					}).click();
					dispatch(closeEditor(editorId));
				}}
			/>
			<EditViewContext.Provider value={context}>
				<Catcher>
					<Container onDragOver={(event) => onDragOverEvent(event)}>
						<Container
							mainAlignment="flex-start"
							height="fill"
							style={{ position: 'relative', maxHeight: '100%', overflowY: 'auto' }}
							background="gray5"
							padding={{ top: 'small', bottom: 'medium', horizontal: 'large' }}
							ref={containerRef}
						>
							{dropZoneEnable && (
								<DropZoneAttachment
									onDragOverEvent={onDragOverEvent}
									onDropEvent={onDropEvent}
									onDragLeaveEvent={onDragLeaveEvent}
								/>
							)}
							<Container crossAlignment="flex-end" height="fit" background="gray6">
								<EditViewHeader
									setShowRouteGuard={setShowRouteGuard}
									setValue={setValue}
									handleSubmit={handleSubmit}
									uploadAttachmentsCb={uploadAttachmentsCb}
								/>
								{isSendingToYourself && <WarningBanner />}

								<StyledComp.RowContainer background="gray6" padding={{ all: 'small' }}>
									<ParticipantsRow />
									<SubjectRow />

									{showAttachments && (
										<StyledComp.ColContainer occupyFull>
											<EditAttachmentsBlock
												editor={editor}
												throttledSaveToDraft={throttledSaveToDraft}
											/>
										</StyledComp.ColContainer>
									)}
								</StyledComp.RowContainer>
							</Container>
							<TextEditorContainer
								onDragOverEvent={onDragOverEvent}
								draftSavedAt={draftSavedAt}
								minHeight={avaibleMinHeight}
								ref={textEditorRef}
							/>
						</Container>
					</Container>
				</Catcher>
			</EditViewContext.Provider>
		</>
	);
}
