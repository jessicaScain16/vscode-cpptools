/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All Rights Reserved.
 * See 'LICENSE' in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { randomUUID } from 'crypto';
import * as telemetry from '../telemetry';
import { CopilotCompletionContextFeatures, CopilotCompletionKind } from './copilotCompletionContextProvider';

export class CopilotCompletionContextTelemetry {
    private static readonly correlationIdKey = 'correlationId';
    private static readonly copilotEventName = 'copilotContextProvider';
    private readonly metrics: Record<string, number> = {};
    private readonly properties: Record<string, string> = {};
    private readonly id: string;

    constructor(correlationId?: string) {
        this.id = correlationId ?? randomUUID().toString();
    }

    private addMetric(key: string, value: number): void {
        this.metrics[key] = value;
    }

    private addProperty(key: string, value: string): void {
        this.properties[key] = value;
    }

    public addInternalCanceled(duration?: number): void {
        this.addProperty('internalCanceled', 'true');
        this.addMetric('canceledElapsedMs', duration ?? -1);
    }

    public addCopilotCanceled(duration?: number): void {
        this.addProperty('copilotCanceled', 'true');
        this.addMetric('canceledElapsedMs', duration ?? -1);
    }

    public addError(): void {
        this.addProperty('error', 'true');
    }

    public addWellKnownError(message: string): void {
        this.addProperty('wellKnownError', message);
    }

    public addCompletionContextKind(completionKind: CopilotCompletionKind): void {
        this.addProperty('completionContextKind', completionKind.toString());
    }

    public addCacheHitEntryGuid(cacheEntryGuid: string): void {
        this.addProperty('usedCacheEntryId', cacheEntryGuid);
    }

    public addResolvedElapsed(duration: number): void {
        this.addMetric('overallResolveElapsedMs', duration);
    }

    public addCacheSize(size: number): void {
        this.addMetric('cacheSize', size);
    }

    public addCacheComputedData(duration: number, id: string): void {
        this.addMetric('cacheComputedElapsedMs', duration);
        this.addProperty('createdCacheEntryId', id);
    }

    public addRequestId(id: number): void {
        this.addProperty('response.requestId', id.toString());
    }

    public addComputeContextElapsed(duration: number): void {
        this.addMetric('computeContextElapsedMs', duration);
    }

    public addGetClientForElapsed(duration: number): void {
        this.addMetric('getClientForElapsedMs', duration);
    }

    public addResponseMetadata(areSnippetsMissing: boolean, codeSnippetsCount?: number, traitsCount?: number, caretOffset?: number,
        featureFlag?: CopilotCompletionContextFeatures): void {
        this.addProperty('response.areCodeSnippetsMissing', areSnippetsMissing.toString());
        // Args can be undefined, in which case the value is set to a
        // special value (e.g. -1) to indicate data is not set.
        this.addMetric('response.caretOffset', caretOffset ?? -1);
        this.addProperty('response.featureFlag', featureFlag?.toString() ?? '<not-set>');
        this.addMetric('response.codeSnippetsCount', codeSnippetsCount ?? -1);
        this.addMetric('response.traitsCount', traitsCount ?? -1);
    }

    public addRequestMetadata(uri: string, caretOffset: number, completionId: string,
        languageId: string, { featureFlag, timeBudgetMs, maxCaretDistance, maxSnippetCount, maxSnippetLength, doAggregateSnippets }: {
            featureFlag?: CopilotCompletionContextFeatures; timeBudgetMs?: number; maxCaretDistance?: number;
            maxSnippetCount?: number; maxSnippetLength?: number; doAggregateSnippets?: boolean;
        } = {}): void {
        this.addProperty('request.completionId', completionId);
        this.addProperty('request.languageId', languageId);
        this.addMetric('request.caretOffset', caretOffset);
        this.addProperty('request.featureFlag', featureFlag?.toString() ?? '<not-set>');
        if (timeBudgetMs !== undefined) { this.addMetric('request.timeBudgetMs', timeBudgetMs); }
        if (maxCaretDistance !== undefined) { this.addMetric('request.maxCaretDistance', maxCaretDistance); }
        if (maxSnippetCount !== undefined) { this.addMetric('request.maxSnippetCount', maxSnippetCount); }
        if (maxSnippetLength !== undefined) { this.addMetric('request.maxSnippetLength', maxSnippetLength); }
        if (doAggregateSnippets !== undefined) { this.addProperty('request.doAggregateSnippets', doAggregateSnippets.toString()); }
    }

    public addCppStandardVersionMetadata(standardVersion: string, elapsedMs: number): void {
        this.addProperty('response.cppStandardVersion', standardVersion);
        this.addMetric('response.cppStandardVersionElapsedMs', elapsedMs);
    }

    public send(postfix?: string): void {
        try {
            const eventName = CopilotCompletionContextTelemetry.copilotEventName + (postfix ? `/${postfix}` : '');
            this.properties[CopilotCompletionContextTelemetry.correlationIdKey] = this.id;
            telemetry.logCopilotEvent(eventName, this.properties, this.metrics);
        } catch (error) {
            console.error('Error logging copilot telemetry event', error);
        }
    }

    public fork(): CopilotCompletionContextTelemetry {
        return new CopilotCompletionContextTelemetry(this.id);
    }
}
