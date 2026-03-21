export const libretaTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1E3A8A; padding-bottom: 10px; }
        .header h1 { margin: 0; color: #1E3A8A; font-size: 18px; }
        .header h2 { margin: 5px 0; font-size: 14px; font-weight: normal; }
        .student-info { margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; background: #f9f9f9; }
        .student-info div { margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #1E3A8A; color: white; }
        .badge { padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
        .badge-ad { background-color: #7C3AED; color: white; }
        .badge-a { background-color: #16A34A; color: white; }
        .badge-b { background-color: #F59E0B; color: white; }
        .badge-c { background-color: #DC2626; color: white; }
        .badge-exo { background-color: #6B7280; color: white; }
        .footer { margin-top: 50px; text-align: center; }
        .signature { display: inline-block; width: 200px; border-top: 1px solid #000; padding-top: 5px; margin: 0 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{colegio.nombre}}</h1>
        <h2>INFORME DE PROGRESO - {{periodo.nombre}} ({{periodo.codigo}})</h2>
    </div>

    <div class="student-info">
        <div><strong>Estudiante:</strong> {{estudiante.apellido_paterno}} {{estudiante.apellido_materno}}, {{estudiante.nombres}}</div>
        <div><strong>DNI:</strong> {{estudiante.dni}} | <strong>Nivel:</strong> {{estudiante.nivel}} | <strong>Grado:</strong> {{estudiante.grado_nombre}} | <strong>Sección:</strong> {{estudiante.seccion_nombre}}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Área / Competencia</th>
                <th style="width: 80px; text-align: center;">Calificativo</th>
                <th>Conclusión Descriptiva</th>
            </tr>
        </thead>
        <tbody>
            {{#each areas}}
            <tr>
                <td colspan="3" style="background-color: #f0f0f0; font-weight: bold;">{{nombre}}</td>
            </tr>
                {{#each competencias}}
                <tr>
                    <td style="padding-left: 20px;">• {{nombre}}</td>
                    <td style="text-align: center;">
                        <span class="badge badge-{{lowercase nota}}">{{nota}}</span>
                    </td>
                    <td>{{conclusion}}</td>
                </tr>
                {{/each}}
            {{/each}}
        </tbody>
    </table>

    <div class="student-info">
        <strong>Asistencia del periodo:</strong> 
        Presentes: {{asistencia.presentes}} | Tardanzas: {{asistencia.tardanzas}} | Faltas Justificadas: {{asistencia.faltas_justificadas}} | Faltas Injustificadas: {{asistencia.faltas_injustificadas}}
    </div>

    <div class="footer">
        <div class="signature">
            Firma del Director
        </div>
        <div class="signature">
            Firma del Docente Tutor
        </div>
    </div>
</body>
</html>
`;
