// PDF Report Generation Utility
// Generates professional political analysis reports

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateCountryReport } from './api';

export async function downloadCountryReport(countryCode: string, countryName: string) {
  try {
    // Generate report data
    const reportData = await generateCountryReport(countryCode);
    
    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPos = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Header
    pdf.setFontSize(24);
    pdf.setTextColor(16, 24, 40);
    pdf.text('Geopolitical Analysis Report', margin, yPos);
    
    yPos += 10;
    pdf.setFontSize(18);
    pdf.setTextColor(59, 130, 246);
    pdf.text(reportData.executiveSummary.title, margin, yPos);
    
    yPos += 8;
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Generated: ${new Date(reportData.metadata.generatedAt).toLocaleString()}`, margin, yPos);
    
    // Line separator
    yPos += 5;
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Live Signal Section (Executive Summary with Rounded Teal Border)
    pdf.setFillColor(20, 184, 166); // Teal color
    pdf.roundedRect(margin, yPos, contentWidth, 30, 5, 5, 'F');
    
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text('LIVE SIGNAL SECTION', margin + 5, yPos + 10);
    
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    const liveSignalLines = pdf.splitTextToSize(reportData.executiveSummary.overview, contentWidth - 10);
    pdf.text(liveSignalLines, margin + 5, yPos + 20);
    yPos += 35;

    // Risk Assessment Box
    pdf.setFillColor(254, 243, 199);
    pdf.roundedRect(margin, yPos, contentWidth, 15, 2, 2, 'F');
    pdf.setFontSize(11);
    pdf.setTextColor(146, 64, 14);
    pdf.text(`Risk Assessment: ${reportData.executiveSummary.riskAssessment}`, margin + 5, yPos + 10);
    yPos += 20;

    // Channel Broadcast Section (with colored left border)
    pdf.setFillColor(20, 184, 166); // Teal vertical bar
    pdf.rect(margin, yPos, 3, 10, 'F');
    
    pdf.setFontSize(14);
    pdf.setTextColor(16, 24, 40);
    pdf.text('CHANNEL BROADCAST', margin + 10, yPos + 7);
    yPos += 15;

    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    const broadcastLines = pdf.splitTextToSize(reportData.executiveSummary.keyFindings.join('. '), contentWidth);
    pdf.text(broadcastLines, margin, yPos);
    yPos += (broadcastLines.length * 5) + 10;

    // AI Assessment Section (with colored left border)
    pdf.setFillColor(20, 184, 166); // Teal vertical bar
    pdf.rect(margin, yPos, 3, 10, 'F');
    
    pdf.setFontSize(14);
    pdf.setTextColor(16, 24, 40);
    pdf.text('AI ASSESSMENT', margin + 10, yPos + 7);
    yPos += 15;

    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    pdf.text(`Conflict Intensity: ${reportData.conflictAnalysis.intensity}`, margin, yPos);
    yPos += 6;
    pdf.text(`Total Events: ${reportData.conflictAnalysis.totalEvents}`, margin, yPos);
    yPos += 6;
    pdf.text(`Regional Impact: High Risk`, margin, yPos);
    yPos += 10;

    // Key Findings
    pdf.setFontSize(12);
    pdf.setTextColor(16, 24, 40);
    pdf.text('Key Findings', margin, yPos);
    yPos += 7;

    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    reportData.executiveSummary.keyFindings.forEach((finding: string, index: number) => {
      pdf.text(`${index + 1}. ${finding}`, margin + 5, yPos);
      yPos += 6;
    });
    yPos += 5;

    // Country Profile Table
    if (yPos > 250) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(16, 24, 40);
    pdf.text('Country Profile', margin, yPos);
    yPos += 8;

    autoTable(pdf, {
      startY: yPos,
      head: [['Attribute', 'Value']],
      body: [
        ['Country', reportData.countryProfile.name],
        ['Capital', reportData.countryProfile.capital],
        ['Population', reportData.countryProfile.population.toLocaleString()],
        ['Area', `${reportData.countryProfile.area.toLocaleString()} km²`],
        ['Region', reportData.countryProfile.region],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: margin, right: margin }
    });

    yPos = (pdf as any).lastAutoTable.finalY + 15;

    // Conflict Analysis
    if (yPos > 240) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(16, 24, 40);
    pdf.text('Conflict Analysis', margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    pdf.text(`Total Events: ${reportData.conflictAnalysis.totalEvents}`, margin, yPos);
    yPos += 6;
    pdf.text(`Total Fatalities: ${reportData.conflictAnalysis.totalFatalities}`, margin, yPos);
    yPos += 6;
    pdf.text(`Intensity Level: ${reportData.conflictAnalysis.intensity.toUpperCase()}`, margin, yPos);
    yPos += 10;

    // Recent Events Table
    if (reportData.conflictAnalysis.recentEvents && reportData.conflictAnalysis.recentEvents.length > 0) {
      autoTable(pdf, {
        startY: yPos,
        head: [['Date', 'Type', 'Location', 'Fatalities']],
        body: reportData.conflictAnalysis.recentEvents.slice(0, 10).map((event: any) => [
          event.date,
          event.eventType,
          event.location,
          event.fatalities.toString()
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: [255, 255, 255]
        },
        margin: { left: margin, right: margin }
      });

      yPos = (pdf as any).lastAutoTable.finalY + 15;
    }

    // Economic Impact
    if (yPos > 240) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(16, 24, 40);
    pdf.text('Economic & Investment Risk', margin, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    
    const economicData = [
      `Stability Index: ${reportData.economicImpact?.stabilityIndex || 'N/A'}/100`,
      `Investment Risk: ${reportData.economicImpact?.investmentRisk || 'Medium'}`,
      `Trade Disruption: ${reportData.economicImpact?.tradeDisruption || 'Moderate'}`,
    ];

    economicData.forEach(line => {
      pdf.text(line, margin, yPos);
      yPos += 6;
    });

    // Predictive Analytics
    yPos += 10;
    pdf.setFontSize(14);
    pdf.setTextColor(16, 24, 40);
    pdf.text('Predictive Analytics', margin, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    pdf.text(`Escalation Risk (30-90 days): ${reportData.predictiveAnalytics?.escalationRisk || 'Medium'}`, margin, yPos);
    yPos += 6;
    pdf.text(`Confidence Level: ${reportData.predictiveAnalytics?.confidenceLevel || 'Medium'}`, margin, yPos);

    // Footer
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      pdf.text(
        `Page ${i} of ${totalPages} | Generated by Geopolitical Analysis Platform`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const fileName = `${countryName}_Geopolitical_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
}

export async function downloadRegionalReport(countries: string[]) {
  // TODO: Implement regional analysis report
  console.log('Regional report for countries:', countries);
}
