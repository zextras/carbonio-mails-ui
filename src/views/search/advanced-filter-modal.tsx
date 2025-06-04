/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { ModalHeader, Divider, ModalFooter } from '@zextras/carbonio-design-system';
import { t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { FormProvider, useForm } from 'react-hook-form';

import { ScrollableContainer } from 'commons/scrollable-container';
import { AttachmentTypeEmailStatusRow } from 'views/search/parts/attachment-type-email-status-row';
import { ReceivedSentAddressRow } from 'views/search/parts/received-sent-address-row';
import { SendReceivedDateRow } from 'views/search/parts/send-date-row';
import { SizeLargerSizeSmallerRow } from 'views/search/parts/size-smaller-size-larger-row';
import { SubjectKeywordRow } from 'views/search/parts/subject-keyword-row';
import { TagFolderRow } from 'views/search/parts/tag-folder-row';
import { ToggleFilters } from 'views/search/parts/toggle-filters';
import { AdvancedFilterModalProps, AdvancedFilterModalFormValues } from 'views/search/types/types';
import { getAdvancedFiltersDefaultValues, getQueryToBe } from 'views/search/utils';

export const AdvancedFilterModal = ({
	query,
	isSharedFolderIncluded,
	onSearchConfirm,
	onClose
}: AdvancedFilterModalProps): React.JSX.Element => {
	const settings = useUserSettings();
	const includeSharedItemsInSearchDefaultPref =
		settings.prefs.zimbraPrefIncludeSharedItemsInSearch === 'TRUE';

	const defaultValues: AdvancedFilterModalFormValues = useMemo(
		() => getAdvancedFiltersDefaultValues(query, isSharedFolderIncluded),
		[query, isSharedFolderIncluded]
	);

	const methods = useForm<AdvancedFilterModalFormValues>({ defaultValues });
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
		setValue('sizeSmaller', []);
		setValue('sizeLarger', []);
		setValue('receivedFrom', []);
		setValue('sentTo', []);
		setValue('attachmentType', []);
		setValue('emailStatus', []);
		setValue('isSharedFolderIncluded', includeSharedItemsInSearchDefaultPref);
		setValue('tagInput', []);
		setValue('folderInput', []);
	}, [setValue, includeSharedItemsInSearchDefaultPref]);

	const queryToBe = getQueryToBe(formValues);

	const onConfirm = useCallback(() => {
		const controller = new AbortController();
		try {
			onSearchConfirm({ query: queryToBe, includeSharedFolders: watch('isSharedFolderIncluded') });
			onClose();
		} catch (error) {
			controller.abort();
		}
		return () => {
			controller.abort();
		};
	}, [onSearchConfirm, queryToBe, onClose, watch]);

	const onCloseCallback = useCallback(() => {
		resetFilters();
		onClose();
	}, [onClose, resetFilters]);

	const isSharedFolderIncludedInput = watch('isSharedFolderIncluded');
	return (
		<>
			<ModalHeader
				onClose={onCloseCallback}
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
					queryToBe.length === 0 &&
					isSharedFolderIncludedInput === includeSharedItemsInSearchDefaultPref
				}
				confirmLabel={t('action.search', 'Search')}
				secondaryActionLabel={t('action.reset', 'Reset filters')}
				onSecondaryAction={resetFilters}
			/>
		</>
	);
};
