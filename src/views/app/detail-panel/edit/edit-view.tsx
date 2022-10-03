/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
	useRef,
	FC,
	SyntheticEvent
} from 'react';
import { Button, Catcher, Container, useModal } from '@zextras/carbonio-design-system';
import { useDispatch, useSelector } from 'react-redux';
import { throttle, filter, isNil, isEmpty } from 'lodash';
import {
	useUserSettings,
	useBoardHooks,
	useUserAccounts,
	replaceHistory,
	addBoard,
	useBoard,
	t
} from '@zextras/carbonio-shell-ui';
import { useForm } from 'react-hook-form';
import moment from 'moment';
import { useQueryParam } from '../../../../hooks/useQueryParam';
import {
	closeEditor,
	createEditor,
	selectDraftId,
	selectEditors,
	updateEditor
} from '../../../../store/editor-slice';
import { ActionsType } from '../../../../commons/utils';
import { selectMessages } from '../../../../store/messages-slice';
import { StoreProvider } from '../../../../store/redux';
import EditAttachmentsBlock from './edit-attachments-block';
import { saveDraft } from '../../../../store/actions/save-draft';
import { uploadAttachments } from '../../../../store/actions/upload-attachments';
import { getMsg } from '../../../../store/actions';
import DropZoneAttachment from './dropzone-attachment';
import { MAILS_ROUTE } from '../../../../constants';
import { addAttachments } from './edit-utils';
import { DeleteDraftModal, RouteLeavingGuard } from './parts/nav-guard';
import * as StyledComp from './parts/edit-view-styled-components';
import { EditViewContext } from './parts/edit-view-context';
import ParticipantsRow from './parts/participants-row';
import TextEditorContainer from './parts/text-editor-container';
import EditViewHeader from './parts/edit-view-header';
import WarningBanner from './parts/warning-banner';
import SubjectRow from './parts/subject-row';
import { MailsEditor, StateType } from '../../../../types';

let counter = 0;

const generateId = (): string => {
	counter += 1;
	return `new-${counter}`;
};

type EditViewPropType = {
	mailId: string;
	folderId: string;
	setHeader: (arg: any) => void;
	toggleAppBoard: boolean;
};

const EditView: FC<EditViewPropType> = ({ mailId, folderId, setHeader, toggleAppBoard }) => {
	const settings = useUserSettings();
	const boardUtilities = useBoardHooks();
	const board = useBoard<any>();
	const createModal = useModal();
	const [editor, setEditor] = useState<MailsEditor>();
	const draftId = useSelector((s: StateType) => selectDraftId(s, editor?.editorId));
	const action = useQueryParam('action');
	const change = useQueryParam('change');

	const editors = useSelector(selectEditors);
	const dispatch = useDispatch();

	const accounts = useUserAccounts();
	const messages = useSelector(selectMessages);

	const { handleSubmit, control, setValue } = useForm();
	const { prefs } = useUserSettings();
	const [dropZoneEnable, setDropZoneEnable] = useState(false);

	const saveDraftCb = useCallback(
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		(data: MailsEditor) => dispatch(saveDraft({ data, prefs })),
		[dispatch, prefs]
	);

	const [saveFirstDraft, setSaveFirstDraft] = useState(true);
	const [draftSavedAt, setDraftSavedAt] = useState('');
	const [timer, setTimer] = useState<any>(null);

	const [loading, setLoading] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [sending, setSending] = useState(false);

	const containerRef = useRef<HTMLInputElement>(null);
	const textEditorRef = useRef<HTMLInputElement>(null);

	const [avaibleMinHeight, setAvaibleMinHeight] = useState(0);

	useLayoutEffect(() => {
		const calculateAvaibleMinHeight = (): void => {
			if (containerRef?.current && containerRef?.current?.clientHeight)
				setAvaibleMinHeight(Number(containerRef?.current?.clientHeight) - 235);
			else setAvaibleMinHeight(0);
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

	const timeout = useMemo(() => (saveFirstDraft ? 2000 : 500), [saveFirstDraft]);
	const throttledSaveToDraft = useCallback(
		(data) => {
			if (timer) clearTimeout(timer);
			const newTimer = setTimeout(() => {
				const newData = { ...editor, ...data };
				if (saveFirstDraft) {
					saveDraftCb(newData);
					setDraftSavedAt(moment().format('HH:mm'));
					setSaveFirstDraft(false);
				} else if (!isNil(editor?.id)) {
					saveDraftCb(newData);
					setDraftSavedAt(moment().format('HH:mm'));
				}
			}, timeout);

			if (newTimer) setTimer(newTimer);
		},
		[editor, saveDraftCb, saveFirstDraft, timeout, timer]
	);

	useEffect(() => () => clearTimeout(timer), [timer]);

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
				title:
					(editor?.subject?.length ?? 0) > 0
						? editor?.subject
						: t('messages.new_email', 'New e-mail')
			});
		}
	}, [editor?.subject, setHeader, action, boardUtilities]);

	useEffect(() => {
		if (!isEmpty(editors) && editorId) {
			boardUtilities?.updateBoard({
				onClose: () => {
					if (draftId && !sending) {
						const closeModal = createModal(
							{
								children: (
									<StoreProvider>
										<DeleteDraftModal
											ids={[draftId]}
											onDelete={(): void => {
												dispatch(closeEditor(editorId));
											}}
											onConfirm={(): void => closeModal()}
											onClose={(): void => closeModal()}
										/>
									</StoreProvider>
								)
							},
							true
						);
					}
				}
			});
		}
	}, [boardUtilities, createModal, dispatch, editorId, editors, draftId, sending]);

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
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
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
		settings
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
					title: editor?.subject ?? ''
				});
			} else {
				addBoard({ url: `${MAILS_ROUTE}/new`, title: t('label.new_email', 'New E-mail') });
			}
			replaceHistory(`/folder/${folderId}`);
		}
	}, [folderId, activeMailId, toggleAppBoard, action, editor?.subject]);

	const onDragOverEvent = (event: SyntheticEvent): void => {
		event.preventDefault();
		setDropZoneEnable(true);
	};

	const onDropEvent = (event: DragEvent): void => {
		event.preventDefault();
		setDropZoneEnable(false);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		addAttachments(saveDraftCb, uploadAttachmentsCb, editor, event?.dataTransfer?.files).then(
			(data) => {
				updateEditorCb({
					attach: { mp: data }
				});
			}
		);
	};

	const onDragLeaveEvent = (event: DragEvent): void => {
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
			saveDraftCb,
			setSending
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
				<Button loading disabled label="" type="ghost" onClick={(): null => null} />
			</Container>
		);
	return (
		<>
			<RouteLeavingGuard
				when={!saveFirstDraft && showRouteGuard && !toggleAppBoard}
				id={editor.id}
				onDeleteDraft={(): void => {
					dispatch(closeEditor(editorId));
				}}
			/>
			<EditViewContext.Provider value={context}>
				<Catcher>
					<Container onDragOver={(event: any): any => onDragOverEvent(event)}>
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
};

export default EditView;
