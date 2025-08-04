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
import { filter, map, some } from 'lodash';

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
import { OptionsDropdown } from './parts/options-dropdown';
import { RecipientsRows } from './parts/recipients-rows';
import { SubjectRow } from './parts/subject-row';
import { TextEditorContainer } from './parts/text-editor-container';
import { WarningBanner } from './parts/warning-banner';
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
	useEditorIsSmimeEncrypt,
	useEditorRecipients
} from '../../../../store/editor';
import { EditorOperationAllowedStatus, EditViewClosingReasons } from '../../../../types';
import { isValidEmail } from '../../../search/parts/utils';
import { EnterPasswordModal } from '../../../settings/certificates/enter-password-modal';
import { checkExistEncryptionPassword } from 'api/check-exist-password-api';
import * as checkIsSmimeEnableApi from 'api/check-is-smime-enable-api';
import { checkPersonalCertificateExist } from 'api/check-personal-certificate-exist-api';
import { GapContainer, GapRow } from 'commons/gap-container';
import { EDIT_VIEW_CLOSING_REASONS, EditViewActions, TIMEOUTS } from 'constants/index';
import { buildArrayFromFileList } from 'helpers/files';
import { getAvailableAddresses } from 'helpers/get-available-addresses';
import { getIdentitiesDescriptors, getIdentityDescriptor } from 'helpers/identities';
import {
	useCertificatesStore,
	useSmimeFeatureStore,
	useSmimePasswordStore
} from 'store/certificates/store';

export type EditViewProp = {
	editorId: string;
	closeController?: () => void;
};

export type EditViewHandle = {
	closeEditView: () => void;
};

// TODO: sendAllowedStatus is completely flawed and full of logical errors
function evaluateSendDisabledReason(
	invalidRecipientsPresent: boolean,
	sendAllowedStatus: EditorOperationAllowedStatus | undefined
): string | undefined {
	let sendDisabledReason;
	if (invalidRecipientsPresent) {
		sendDisabledReason = t('label.invalid_recipients', `One or more recipients are invalid`);
	} else {
		sendDisabledReason = sendAllowedStatus?.reason;
	}
	return sendDisabledReason;
}

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

	const {
		recipients: { to, cc, bcc }
	} = useEditorRecipients(editorId);
	const invalidRecipientsPresent = useMemo(
		() => some([...to, ...cc, ...bcc], (recipient) => !isValidEmail(recipient.address)),
		[bcc, cc, to]
	);

	useEffect(() => {
		if (!draftId) saveDraft();
	}, [draftId, saveDraft]);

	const { status: sendAllowedStatus, send: sendMessage } = useEditorSend(editorId);
	const draftSaveProcessStatus = useEditorDraftSaveProcessStatus(editorId);
	const createSnackbar = useSnackbar();
	const [dropZoneEnabled, setDropZoneEnabled] = useState<boolean>(false);
	const { addStandardAttachments } = useEditorAttachments(editorId);

	const keepOrDiscardDraft = useKeepOrDiscardDraft();

	useEffect(() => {
		if (!isCarbonioCE) {
			checkIsSmimeEnableApi.checkIsSmimeEnabled().then((res) => {
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
						saveDraft();
						deleteEditor({ id: editorId });
						close(EDIT_VIEW_CLOSING_REASONS.EXTERNAL_CLOSE_REQUEST);
					},
					draftId,
					editorId
				});
			}
		}),
		[close, draftId, editorId, keepOrDiscardDraft, saveDraft]
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

	const { savedStandardAttachments } = useEditorAttachments(editorId);

	const onSendClick = useCallback((): void => {
		const onConfirmCallback = async (): Promise<void> => {
			close(EDIT_VIEW_CLOSING_REASONS.MESSAGE_SENT);
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
		sendMessage,
		onSendCountdownTick,
		onSendComplete,
		onSendError
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
		[editorId, createModal, closeModal, savedStandardAttachments, setAutoSendTime, saveDraft, close]
	);
	const sendDisabled =
		isMailSizeWarning || !sendAllowedStatus?.allowed || !draftId || invalidRecipientsPresent;

	const sendDisabledReason = evaluateSendDisabledReason(
		invalidRecipientsPresent,
		sendAllowedStatus
	);

	return (
		<Container
			data-testid={'edit-view-editor'}
			mainAlignment={flexStart}
			height={'fit'}
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
							disabled={sendDisabled}
							tooltip={sendDisabledReason ?? ''}
						/>
					</GapRow>
				</GapRow>

				{/* Header end */}

				<SendToYourselfWarningBanner editorId={editorId} />
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
					<EditAttachmentsBlock editorId={editorId} />
					<MemoizedTextEditorContainer onDragOver={onDragOverEvent} editorId={editorId} />
					<EditViewDraftSaveInfo processStatus={draftSaveProcessStatus} />
				</GapContainer>
			</GapContainer>
		</Container>
	);
});
