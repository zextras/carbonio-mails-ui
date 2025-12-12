/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactNode } from 'react';

import { UserEvent } from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';

import { setupTest } from '@test-setup';
import {
	AdvancedFilterModalFormValues,
	AdvancedFilterModalProps,
	Query
} from 'views/search/types/types';
import { getAdvancedFiltersDefaultValues } from 'views/search/utils';

export const emptyQuery: Query = [];

export const defaultValues = getAdvancedFiltersDefaultValues(emptyQuery, false);

export const defaultProps: AdvancedFilterModalProps = {
	isSharedFolderIncluded: false,
	onClose: vi.fn(),
	query: emptyQuery,
	onSearchConfirm: vi.fn()
};

export const renderWithUseForm = async (
	component: React.JSX.Element,
	formValues: Partial<AdvancedFilterModalFormValues> = {}
): Promise<{ user: UserEvent }> => {
	const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => {
		const methods = useForm<AdvancedFilterModalFormValues>({ defaultValues: formValues });
		return <FormProvider {...methods}>{children}</FormProvider>;
	};

	const { user } = setupTest(<Wrapper>{component}</Wrapper>);
	return { user };
};
