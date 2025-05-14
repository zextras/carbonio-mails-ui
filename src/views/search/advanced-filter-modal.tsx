/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { CustomModal, ModalHeader, Divider, ModalFooter } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { FormProvider, useForm } from 'react-hook-form';

import { AttachmentTypeEmailStatusRow } from './parts/attachment-type-email-status-row';
import { ReceivedSentAddressRow } from './parts/received-sent-address-row';
import { SendReceivedDateRow } from './parts/send-date-row';
import { SizeLargerSizeSmallerRow } from './parts/size-smaller-size-larger-row';
import { SubjectKeywordRow } from './parts/subject-keyword-row';
import { TagFolderRow } from './parts/tag-folder-row';
import { ToggleFilters } from './parts/toggle-filters';
import { AdvancedFilterModalProps, FormValues } from './types/types';
import { getAdvancedFiltersDefaultValues, getQueryToBe } from './utils';
import { ScrollableContainer } from '../../commons/scrollable-container';

export const AdvancedFilterModal = ({
	open,
	onClose,
	query,
	isSharedFolderIncludedInitialValue,
	onSearchConfirm,
	includeSharedItemsInSearchPref
}: AdvancedFilterModalProps): React.JSX.Element => {
	const [isSharedFolderIncluded, setIsSharedFolderIncluded] = useState(
		isSharedFolderIncludedInitialValue
	);

	const defaultValues: FormValues = useMemo(
		() => getAdvancedFiltersDefaultValues(query, isSharedFolderIncluded),
		[query, isSharedFolderIncluded]
	);

	const methods = useForm<FormValues>({ defaultValues });
	const { watch, setValue, control } = methods;

	const formValues = watch();
	const resetFilters = useCallback(() => {
		setValue('keywordInput', []);
		setValue('subjectInput', []);
		setValue('hasAttachment', false);
		setValue('isFlagged', false);
		setValue('isUnread', false);
		setValue('sentBefore', null);
		setValue('sentAfter', null);
		setValue('sentOn', null);
		setValue('sizeSmaller', []);
		setValue('sizeLarger', []);
		setValue('receivedFrom', []);
		setValue('sentTo', []);
		setValue('attachmentType', []);
		setValue('emailStatus', []);
		setValue('isSharedFolderIncluded', includeSharedItemsInSearchPref);
		setIsSharedFolderIncluded(includeSharedItemsInSearchPref);
	}, [setValue, includeSharedItemsInSearchPref]);

	useEffect(() => {
		setIsSharedFolderIncluded(formValues.isSharedFolderIncluded);
	}, [formValues.isSharedFolderIncluded]);

	const queryToBe = getQueryToBe(formValues);

	const onConfirm = useCallback(() => {
		const controller = new AbortController();
		try {
			onSearchConfirm({ query: queryToBe, includeSharedFolders: isSharedFolderIncluded });
			onClose();
		} catch (error) {
			controller.abort();
		}
		return () => {
			controller.abort();
		};
	}, [onSearchConfirm, queryToBe, isSharedFolderIncluded, onClose]);

	useEffect(() => {
		methods.reset(defaultValues);
	}, [defaultValues, methods, query]);

	if (!open) return <></>;

	return (
		<CustomModal open={open} onClose={onClose} maxHeight="90vh" size="medium">
			<ModalHeader
				onClose={onClose}
				title={t('label.single_advanced_filter', 'Advanced Filters')}
				showCloseIcon
			/>
			<Divider />

			<ScrollableContainer
				padding={{ horizontal: 'medium', vertical: 'small' }}
				mainAlignment={'flex-start'}
			>
				<FormProvider {...methods}>
					<ToggleFilters />
					<SubjectKeywordRow control={control} />
					<ReceivedSentAddressRow control={control} />
					<AttachmentTypeEmailStatusRow control={control} />
					<SizeLargerSizeSmallerRow control={control} />
					<SendReceivedDateRow control={control} />
					<TagFolderRow control={control} setValue={setValue} />
				</FormProvider>
			</ScrollableContainer>
			<Divider />
			<ModalFooter
				onConfirm={onConfirm}
				confirmDisabled={queryToBe.length === 0}
				secondaryActionDisabled={
					queryToBe.length === 0 && isSharedFolderIncluded === includeSharedItemsInSearchPref
				}
				confirmLabel={t('action.search', 'Search')}
				secondaryActionLabel={t('action.reset', 'Reset filters')}
				onSecondaryAction={resetFilters}
			/>
		</CustomModal>
	);
};
