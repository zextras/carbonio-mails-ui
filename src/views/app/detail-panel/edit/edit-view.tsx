/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { memo, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';

import {
	Button,
	Container,
	Tooltip,
	ButtonProps,
	useSnackbar,
	useModal
} from '@zextras/carbonio-design-system';
import { t, useIsCarbonioCE } from '@zextras/carbonio-shell-ui';
import { filter, map } from 'lodash';
import type { TinyMCE } from 'tinymce/tinymce';

import { checkSubjectAndAttachment } from './check-subject-attachment';
import DropZoneAttachment from './dropzone-attachment';
import { EditAttachmentsBlock } from './edit-attachments-block';
import { createEditBoard } from './edit-view-board';
import { AddAttachmentsDropdown } from './parts/add-attachments-dropdown';
import { ChangeSignaturesDropdown } from './parts/change-signatures-dropdown';
import { useKeepOrDiscardDraft } from './parts/delete-draft';
import { EditViewDraftSaveInfo } from './parts/edit-view-draft-save-info';
import { EditViewIdentitySelector } from './parts/edit-view-identity-selector';
import { EditViewSendButtons } from './parts/edit-view-send-buttons';
import { LargeFileUploadInfoBanner } from './parts/large-file-upload-info-banner';
import { OptionsDropdown } from './parts/options-dropdown';
import { RecipientsRows } from './parts/recipients-rows';
import { SizeExceededWarningBanner } from './parts/size-exceeded-waring-banner';
import { SubjectRow } from './parts/subject-row';
import { TextEditorContainer } from './parts/text-editor-container';
import { WarningBanner } from './parts/warning-banner';
import { checkExistEncryptionPassword } from '../../../../api/check-exist-password-api';
import { checkIsSmimeEnabled } from '../../../../api/check-is-smime-enable-api';
import { checkPersonalCertificateExist } from '../../../../api/check-personal-certificate-exist-api';
import { GapContainer, GapRow } from '../../../../commons/gap-container';
import { EDIT_VIEW_CLOSING_REASONS, EditViewActions, TIMEOUTS } from '../../../../constants';
import { buildArrayFromFileList } from '../../../../helpers/files';
import { getAvailableAddresses } from '../../../../helpers/get_available_addresses';
import { getIdentitiesDescriptors, getIdentityDescriptor } from '../../../../helpers/identities';
import {
	useCertificatesStore,
	useSmimeFeatureStore,
	useSmimePasswordStore
} from '../../../../store/certificates/store';
import {
	useEditorAutoSendTime,
	useEditorDraftSave,
	useEditorDraftSaveProcessStatus,
	useEditorSend,
	useEditorAttachments,
	deleteEditor,
	useEditorDid,
	useEditorsStore,
	useEditorIsSmimeSign,
	useEditorIdentityId,
	useEditorIsSmimeEncrypt
} from '../../../../store/editor';
import { EditViewClosingReasons } from '../../../../types';
import { updateEditorWithSmartLinks } from '../../../../ui-actions/utils';
import { EnterPasswordModal } from '../../../settings/certificates/enter-password-modal';

export type EditViewProp = {
	editorId: string;
	closeController?: () => void;
};

export type EditViewHandle = {
	closeEditView: () => void;
};

type FileSelectProps = {
	editor: TinyMCE;
	files: FileList;
};
const MemoizedTextEditorContainer = memo(TextEditorContainer);
const MemoizedRecipientsRows = memo(RecipientsRows);
const MemoizedSubjectRow = memo(SubjectRow);
const MemoizedOptionsDropdown = memo(OptionsDropdown);
const MemoizedChangeSignaturesDropdown = memo(ChangeSignaturesDropdown);
const MemoizedAddAttachmentsDropdown = memo(AddAttachmentsDropdown);
const MemoizedEditViewIdentitySelector = memo(EditViewIdentitySelector);

const SendToYourselfWarningBanner = ({
	editorId
}: {
	editorId: string;
}): React.JSX.Element | null => {
	const toValue = useEditorsStore((state) => state.editors[editorId].recipients.to);

	// TODO ask designers if the check must be performed only on TO or also on CC and BCC
	const isSendingToYourself = useMemo(() => {
		const availableAddresses = map(
			getAvailableAddresses(),
			(availableAddress) => availableAddress.address
		);
		const recipientsAddresses = map(toValue, (recipient) => recipient.address);

		return (
			filter(recipientsAddresses, (recipientAddress): boolean =>
				availableAddresses.includes(recipientAddress)
			).length > 0
		);
	}, [toValue]);

	const warningBannerText = t('messages.warning.sending_to_yourself', {
		defaultValue: 'You are sending this message to yourself'
	});
	const WarningBannerIcon = 'AlertCircleOutline';
	const WarningBannerIconColor = 'info';

	return isSendingToYourself ? (
		<WarningBanner
			text={warningBannerText}
			icon={WarningBannerIcon}
			iconColor={WarningBannerIconColor}
			bottomBorderColor="info"
		/>
	) : null;
};

export const EditView = React.forwardRef<EditViewHandle, EditViewProp>(function EditViewFn(
	{ editorId, closeController },
	ref
) {
	const { setAutoSendTime } = useEditorAutoSendTime(editorId);

	const [isMailSizeWarning, setIsMailSizeWarning] = useState<boolean>(false);
	const [largeFileUploadInfoBannerVisible, setLargeFileUploadInfoBannerVisible] = useState(false);
	const { status: saveDraftAllowedStatus, saveDraft } = useEditorDraftSave(editorId);
	const { did: draftId } = useEditorDid(editorId);
	const { identityId } = useEditorIdentityId(editorId);
	const identityEmailAddress = getIdentityDescriptor(identityId)?.fromAddress;
	const { isSmimeSign, setIsSmimeSign } = useEditorIsSmimeSign(editorId);
	const { isSmimeEncrypt, setIsSmimeEncrypt } = useEditorIsSmimeEncrypt(editorId);
	const getCertificate = useCertificatesStore((state) => state.getCertificate);
	const { smimePassword } = useSmimePasswordStore();
	const isCarbonioCE = useIsCarbonioCE();
	const { isSmimeEnabled } = useSmimeFeatureStore();

	useEffect(() => {
		if (!draftId) saveDraft();
	}, [draftId, saveDraft]);

	const { status: sendAllowedStatus, send: sendMessage } = useEditorSend(editorId);
	const draftSaveProcessStatus = useEditorDraftSaveProcessStatus(editorId);
	const createSnackbar = useSnackbar();
	const [dropZoneEnabled, setDropZoneEnabled] = useState<boolean>(false);
	const { addStandardAttachments, addInlineAttachments } = useEditorAttachments(editorId);

	const keepOrDiscardDraft = useKeepOrDiscardDraft();

	useEffect(() => {
		if (!isCarbonioCE) {
			checkIsSmimeEnabled().then((res) => {
				if ('data' in res) {
					useSmimeFeatureStore.getState().updateIsSmimeEnabled(true);
				} else {
					useSmimeFeatureStore.getState().updateIsSmimeEnabled(false);
				}
			});
		} else {
			useSmimeFeatureStore.getState().updateIsSmimeEnabled(false);
		}
	}, [isCarbonioCE]);

	// Performs cleanups and invoke the external callback
	const close = useCallback(
		(reason?: EditViewClosingReasons) => {
			if (reason !== EDIT_VIEW_CLOSING_REASONS.EXTERNAL_CLOSE_REQUEST) {
				closeController && closeController();
			}
		},
		[closeController]
	);

	const onSaveClick = useCallback<ButtonProps['onClick']>((): void => {
		saveDraft();
	}, [saveDraft]);

	useImperativeHandle(
		ref,
		() => ({
			closeEditView: (): void => {
				if (!draftId) {
					return;
				}

				keepOrDiscardDraft({
					onConfirm: (): void => {
						deleteEditor({ id: editorId });
						close(EDIT_VIEW_CLOSING_REASONS.EXTERNAL_CLOSE_REQUEST);
					},
					draftId,
					editorId
				});
			}
		}),
		[close, draftId, editorId, keepOrDiscardDraft]
	);

	const onSendCountdownTick = useCallback(
		(countdown: number, cancel: () => void): void => {
			createSnackbar({
				key: 'send',
				replace: true,
				severity: 'info',
				label: t('messages.snackbar.sending_mail_in_count', {
					count: countdown,
					defaultValue_one: 'Sending your message in {{count}} second',
					defaultValue_other: 'Sending your message in {{count}} seconds'
				}),
				autoHideTimeout: (countdown ?? 0) * 1000,
				hideButton: !cancel,
				actionLabel: t('label.undo', 'Undo'),
				onActionClick: () => {
					cancel();
					createEditBoard({
						action: EditViewActions.RESUME,
						actionTargetId: editorId
					});
				}
			});
		},
		[createSnackbar, editorId]
	);

	const onSendError = useCallback((): void => {
		createSnackbar({
			key: `mail-${editorId}`,
			replace: true,
			severity: 'error',
			label: t('label.error_try_again', 'Something went wrong, please try again'),
			autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
			hideButton: true
		});
		createEditBoard({
			action: EditViewActions.RESUME,
			actionTargetId: editorId
		});
	}, [createSnackbar, editorId]);

	const onSendComplete = useCallback((): void => {
		createSnackbar({
			key: `mail-${editorId}`,
			replace: true,
			severity: 'success',
			label: t('messages.snackbar.mail_sent', 'Message sent'),
			autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
			hideButton: true
		});
		deleteEditor({ id: editorId });
	}, [createSnackbar, editorId]);

	const { createModal, closeModal } = useModal();

	const showIdentitySelector = useMemo<boolean>(() => getIdentitiesDescriptors().length > 1, []);

	const onDragOverEvent = useCallback((event: React.DragEvent): void => {
		const eventType = event?.dataTransfer?.types;
		if (eventType?.includes('contact')) {
			setDropZoneEnabled(false);

			return;
		}
		event.preventDefault();
		setDropZoneEnabled(true);
	}, []);

	// TODO complete with new attachment management
	const onDropEvent = useCallback(
		(event: DragEvent): void => {
			event.preventDefault();
			setDropZoneEnabled(false);
			const fileList = event?.dataTransfer?.files;
			if (!fileList) {
				return;
			}

			const files = buildArrayFromFileList(fileList);
			addStandardAttachments(files);
		},
		[addStandardAttachments]
	);

	const onDragLeaveEvent = useCallback((event: DragEvent): void => {
		event.preventDefault();
		setDropZoneEnabled(false);
	}, []);

	const flexStart = 'flex-start';
	const onInlineAttachmentsSelected = useCallback(
		({ editor: tinymce, files: fileList }: FileSelectProps): void => {
			const files = buildArrayFromFileList(fileList);
			addInlineAttachments(files, {
				onSaveComplete: (inlineAttachments) => {
					inlineAttachments.forEach((inlineAttachment) => {
						const img = `&nbsp;<img pnsrc="${inlineAttachment.cidUrl}" data-mce-src="${inlineAttachment.cidUrl}" src="${inlineAttachment.downloadServiceUrl}" /><br/>`;
						tinymce?.activeEditor?.insertContent(img);
					});
				}
			});
		},
		[addInlineAttachments]
	);

	const { savedStandardAttachments } = useEditorAttachments(editorId);

	const draftSmartLinks = useMemo(
		() =>
			savedStandardAttachments
				.filter((attachment) => attachment.requiresSmartLinkConversion)
				.map((attachment) => ({ draftId: attachment.messageId, partName: attachment.partName })),
		[savedStandardAttachments]
	);
	const [isConvertingToSmartLink, setIsConvertingToSmartLink] = useState(false);

	const createSmartLinksAction = useCallback((): Promise<void> => {
		setIsConvertingToSmartLink(true);

		return updateEditorWithSmartLinks({ editorId, t, createSnackbar }).finally(() =>
			setIsConvertingToSmartLink(false)
		);
	}, [editorId, createSnackbar]);

	const onSendClick = useCallback((): void => {
		const onConfirmCallback = async (): Promise<void> => {
			close(EDIT_VIEW_CLOSING_REASONS.MESSAGE_SENT);
			if (draftSmartLinks.length > 0) {
				try {
					await createSmartLinksAction();
				} catch (err) {
					onSendError?.();
					return;
				}
			}
			sendMessage({
				onCountdownTick: onSendCountdownTick,
				onComplete: onSendComplete,
				onError: onSendError
			});
		};
		checkSubjectAndAttachment({
			editorId,
			hasAttachments: savedStandardAttachments.length > 0,
			onConfirmCallback,
			createModal,
			closeModal
		});
	}, [
		editorId,
		savedStandardAttachments,
		close,
		createModal,
		closeModal,
		draftSmartLinks.length,
		sendMessage,
		onSendCountdownTick,
		onSendComplete,
		onSendError,
		createSmartLinksAction
	]);

	const handleCertificateResponse = useCallback(
		(option: string, res: { data: Response } | { error: unknown }) => {
			if ('data' in res) {
				if (option === 'sign') {
					setIsSmimeSign(true);
				} else {
					setIsSmimeEncrypt(true);
				}
			} else {
				if (option === 'sign') {
					setIsSmimeSign(false);
				} else {
					setIsSmimeEncrypt(false);
				}
				createSnackbar({
					key: `info-on-certificate-missing`,
					replace: true,
					severity: 'error',
					label: t(
						'settings.uploadCertificate.uploadCertificateInSettings',
						'Please upload your certificate from settings'
					),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		},
		[createSnackbar, setIsSmimeEncrypt, setIsSmimeSign]
	);

	const checkCertificateExist = useCallback(
		(option: string, password?: string) => {
			if (identityEmailAddress) {
				checkPersonalCertificateExist(password ?? smimePassword, identityEmailAddress).then((res) =>
					handleCertificateResponse(option, res)
				);
			}
		},
		[identityEmailAddress, smimePassword, handleCertificateResponse]
	);

	const checkEncryptionPassword = useCallback(
		(option: string) => {
			checkExistEncryptionPassword().then((res) => {
				if ('data' in res) {
					const id = Date.now().toString();
					createModal(
						{
							id,
							size: 'medium',
							children: (
								<Container crossAlignment="baseline">
									<EnterPasswordModal
										onConfirm={(password): void => {
											checkCertificateExist(option, password);
										}}
										onClose={(): void => closeModal?.(id)}
										hideReset
									/>
								</Container>
							)
						},
						true
					);
				} else {
					if (option === 'sign') {
						setIsSmimeSign(false);
					} else {
						setIsSmimeEncrypt(false);
					}
					createSnackbar({
						key: `info-on-password-missing`,
						replace: true,
						severity: 'error',
						label: t(
							'settings.uploadCertificate.createPasswordFromSettings',
							'Please create your encryption password from settings'
						),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		},
		[
			createModal,
			checkCertificateExist,
			closeModal,
			createSnackbar,
			setIsSmimeSign,
			setIsSmimeEncrypt
		]
	);

	useEffect(() => {
		if (identityEmailAddress && (isSmimeSign || isSmimeEncrypt)) {
			if (isSmimeSign) {
				checkCertificateExist('sign');
			} else {
				checkCertificateExist('encrypt');
			}
		}
	}, [
		identityEmailAddress,
		getCertificate,
		setIsSmimeSign,
		isSmimeSign,
		isSmimeEncrypt,
		checkEncryptionPassword,
		checkCertificateExist
	]);

	const handleSmimeSelected = useCallback((): void => {
		if (identityEmailAddress) {
			if (smimePassword !== '') {
				checkCertificateExist('sign');
			} else {
				checkEncryptionPassword('sign');
			}
		}
	}, [checkCertificateExist, checkEncryptionPassword, identityEmailAddress, smimePassword]);

	const handleSmimeDeselected = useCallback((): void => {
		setIsSmimeSign(false);
	}, [setIsSmimeSign]);

	const handleEncryptSelected = useCallback((): void => {
		if (identityEmailAddress) {
			if (smimePassword !== '') {
				checkCertificateExist('encrypt');
			} else {
				checkEncryptionPassword('encrypt');
			}
		}
	}, [checkCertificateExist, checkEncryptionPassword, identityEmailAddress, smimePassword]);

	const handleEncryptDeselected = useCallback((): void => {
		setIsSmimeEncrypt(false);
	}, [setIsSmimeEncrypt]);

	const onSendLaterClick = useCallback(
		(scheduledTime: number): void => {
			const onConfirmCallback = async (): Promise<void> => {
				if (draftSmartLinks.length > 0) {
					try {
						await createSmartLinksAction();
					} catch (err) {
						onSendError?.();
						return;
					}
				}
				setAutoSendTime(scheduledTime);
				saveDraft();
				close(EDIT_VIEW_CLOSING_REASONS.MESSAGE_SEND_SCHEDULED);
			};
			checkSubjectAndAttachment({
				editorId,
				onConfirmCallback,
				createModal,
				closeModal,
				hasAttachments: savedStandardAttachments.length > 0
			});
		},
		[
			editorId,
			createModal,
			closeModal,
			savedStandardAttachments,
			draftSmartLinks.length,
			setAutoSendTime,
			saveDraft,
			close,
			createSmartLinksAction,
			onSendError
		]
	);
	return (
		<Container
			data-testid={'edit-view-editor'}
			mainAlignment={flexStart}
			crossAlignment={flexStart}
			padding={{ all: 'large' }}
			background={'gray5'}
			onDragOver={onDragOverEvent}
		>
			{dropZoneEnabled && (
				<DropZoneAttachment
					onDragOverEvent={onDragOverEvent}
					onDropEvent={onDropEvent}
					onDragLeaveEvent={onDragLeaveEvent}
				/>
			)}
			<GapContainer mainAlignment={flexStart} crossAlignment={flexStart} gap={'large'}>
				{/* Header start */}

				<GapRow
					mainAlignment={showIdentitySelector ? 'space-between' : 'flex-end'}
					orientation="horizontal"
					width="fill"
					gap={'medium'}
				>
					{showIdentitySelector && <MemoizedEditViewIdentitySelector editorId={editorId} />}

					<GapRow mainAlignment={'flex-end'} gap={'medium'}>
						<MemoizedAddAttachmentsDropdown editorId={editorId} />
						<MemoizedChangeSignaturesDropdown editorId={editorId} />
						<MemoizedOptionsDropdown
							editorId={editorId}
							onSmimeOptionChange={(isSmimeSelected: boolean): void =>
								isSmimeSelected ? handleSmimeSelected() : handleSmimeDeselected()
							}
							onSmimeEncryptOptionChange={(isEncryptSelected: boolean): void =>
								isEncryptSelected ? handleEncryptSelected() : handleEncryptDeselected()
							}
							isSmimeEnabled={isSmimeEnabled}
						/>
						<Tooltip
							label={saveDraftAllowedStatus?.reason}
							disabled={saveDraftAllowedStatus?.allowed}
						>
							<Button
								data-testid="BtnSaveMail"
								type="outlined"
								onClick={onSaveClick}
								label={`${t('label.save', 'Save')}`}
								disabled={!saveDraftAllowedStatus?.allowed}
							/>
						</Tooltip>
						<EditViewSendButtons
							onSendLater={onSendLaterClick}
							onSendNow={onSendClick}
							disabled={
								isMailSizeWarning ||
								!sendAllowedStatus?.allowed ||
								isConvertingToSmartLink ||
								!draftId
							}
							tooltip={sendAllowedStatus?.reason ?? ''}
							isLoading={isConvertingToSmartLink}
						/>
					</GapRow>
				</GapRow>

				{/* Header end */}

				<SendToYourselfWarningBanner editorId={editorId} />
				{largeFileUploadInfoBannerVisible && <LargeFileUploadInfoBanner />}
				<SizeExceededWarningBanner
					editorId={editorId}
					isMailSizeWarning={isMailSizeWarning}
					setIsMailSizeWarning={setIsMailSizeWarning}
				/>
				<GapContainer
					mainAlignment={flexStart}
					crossAlignment={flexStart}
					background={'white'}
					padding={{ all: 'small' }}
					gap={'small'}
				>
					<Container mainAlignment={flexStart} crossAlignment={flexStart} height={'fit'}>
						<MemoizedRecipientsRows editorId={editorId} />
					</Container>
					<Container mainAlignment={flexStart} crossAlignment={flexStart} height={'fit'}>
						<MemoizedSubjectRow editorId={editorId} />
					</Container>

					<EditAttachmentsBlock
						editorId={editorId}
						setLargeFileUploadInfoBannerVisible={setLargeFileUploadInfoBannerVisible}
					/>

					<MemoizedTextEditorContainer
						onDragOver={onDragOverEvent}
						onFilesSelected={onInlineAttachmentsSelected}
						editorId={editorId}
						minHeight={0}
						disabled={false}
					/>
					<EditViewDraftSaveInfo processStatus={draftSaveProcessStatus} />
				</GapContainer>
			</GapContainer>
		</Container>
	);
});
